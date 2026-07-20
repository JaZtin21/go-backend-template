// apolloClient.ts
//
// Module-level Apollo Client singleton. Exists as its own file (not inside
// the provider component) specifically so non-React code — like
// tinybase/syncEngine.ts — can `import client from '../apolloClient'` and
// call client.query()/client.mutate() directly, without needing a React
// tree or hooks.
//
// Auth token + refresh logic still lives in ApolloProviderWithAuth (it owns
// the React state), but it pushes the current token / refresh function into
// this module via setAuthToken() / setRefreshHandler() so the links here
// can use them.

import { ApolloClient, InMemoryCache, ApolloLink, HttpLink, Observable } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { createUploadLink } from '~/api/graphql';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8080/query';
const GRAPHQL_WS_ENDPOINT = GRAPHQL_ENDPOINT.replace(/^http/, 'ws');

// -------------------------------------------------------------------------
// Auth state, set by ApolloProviderWithAuth once it mounts / whenever the
// jwt or refresh callback changes. Module-level so links below (which are
// built once, at import time) can always read the *current* value via
// these closures instead of a stale one.
// -------------------------------------------------------------------------
let currentToken = '';
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setAuthToken(token: string) {
    currentToken = token;
}

export function setRefreshHandler(fn: () => Promise<string | null>) {
    refreshHandler = fn;
}

// Plain, unauthenticated client for the login/refresh/logout mutations
// themselves (they must not carry a possibly-stale/expired Authorization
// header, and refresh in particular would deadlock against authInterceptorLink
// if it went through the authenticated client).
export const authLinkClient = new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_ENDPOINT, credentials: 'include' }),
    cache: new InMemoryCache(),
});

// -------------------------------------------------------------------------
// Authenticated client — same link chain as before, just living at module
// scope now instead of inside a useMemo.
// -------------------------------------------------------------------------
const httpUploadLink = createUploadLink({
    uri: GRAPHQL_ENDPOINT,
    credentials: 'include',
});

// v4: SetContextLink takes (prevContext, operation) — args flipped vs. the
// old deprecated setContext((operation, prevContext) => ...).
const authInterceptorLink = new SetContextLink((prevContext) => ({
    headers: {
        ...prevContext.headers,
        Authorization: currentToken ? `Bearer ${currentToken}` : '',
    },
}));

// v4: ErrorLink class replaces the deprecated onError() function. Handler
// still receives { error, operation, forward }; `error` is narrowed via
// CombinedGraphQLErrors.is(error) to get `.errors`.
const centralErrorLink = new ErrorLink(({ error, operation, forward }) => {
    let shouldRetry = false;

    if (CombinedGraphQLErrors.is(error)) {
        for (const err of error.errors) {
            console.log('[apolloClient] GraphQLError intercepted:', err);
            if (
                err.extensions?.code === 'TOKEN_EXPIRED' ||
                err.extensions?.code === 'UNAUTHENTICATED'
            ) {
                shouldRetry = true;
            }
        }
    }

    if (!shouldRetry) return;
    if (!refreshHandler) {
        console.warn('[apolloClient] Auth error but no refresh handler registered yet — provider may not have mounted.');
        return;
    }

    const hasRetried = operation.getContext().hasRetried || false;
    if (hasRetried) {
        console.warn('[apolloClient] Already retried this operation once, not retrying again.');
        return;
    }

    return new Observable<any>((observer) => {
        refreshHandler!()
            .then((freshToken) => {
                if (!freshToken) {
                    observer.error(error);
                    return;
                }
                operation.setContext(({ headers = {} }: any) => ({
                    headers: {
                        ...headers,
                        Authorization: `Bearer ${freshToken}`,
                    },
                    hasRetried: true,
                }));
                const retrySubscription = forward(operation).subscribe({
                    next: observer.next.bind(observer),
                    error: observer.error.bind(observer),
                    complete: observer.complete.bind(observer),
                });
                return () => retrySubscription.unsubscribe();
            })
            .catch((err) => observer.error(err));
    });
});

const subscriptionWsLink = new GraphQLWsLink(
    createClient({
        url: GRAPHQL_WS_ENDPOINT,
        connectionParams: () => ({
            headers: {
                Authorization: currentToken ? `Bearer ${currentToken}` : '',
            },
        }),
    })
);

// v4: ApolloLink.split(...) and ApolloLink.from([...]) are static methods
// on ApolloLink, replacing the deprecated standalone `split` and `from`
// exports.
const transportSplitLink = ApolloLink.split(
    ({ query }) => {
        const nodeDefinition = getMainDefinition(query);
        return (
            nodeDefinition.kind === 'OperationDefinition' &&
            nodeDefinition.operation === 'subscription'
        );
    },
    subscriptionWsLink,
    ApolloLink.from([centralErrorLink, authInterceptorLink, httpUploadLink])
);

const client = new ApolloClient({
    link: transportSplitLink,
    cache: new InMemoryCache(),
});

export default client;