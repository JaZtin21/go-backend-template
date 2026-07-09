import { ApolloClient, InMemoryCache, from, split } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { createUploadLink } from './createUploadLink';
import { useGoogleLogin } from '@react-oauth/google';
import { useEffect, useMemo, useState, createContext, useContext, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Observable } from '@apollo/client/utilities';
import { REFRESH_TOKEN_MUTATION, GOOGLE_LOGIN_MUTATION, LOGOUT_MUTATION } from './auth/auth-queries';
import { ME_QUERY } from './user/user-queries';
import { setUser } from '../../store';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8080/query';

// Create a basic Apollo client for auth operations (without auth link)
const authClient = new ApolloClient({
    link: createUploadLink({ uri: GRAPHQL_ENDPOINT, credentials: 'include' }),
    cache: new InMemoryCache(),
});

// Define user info type
interface UserInfo {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: 'CUSTOMER' | 'OWNER' | 'ADMIN';
    isActive?: boolean;
    shops?: string[];
    profilePhoto?: string;
    coverPhoto?: string;
    [key: string]: any;
}

// Enhanced Auth context type
interface AuthContextType {
    isAuthenticated: boolean;
    userInfo: UserInfo | null;
    jwt: string;
    logoutAndClear: () => void;
    setUserJwt: (token: string) => void;
    setUserInfo: (info: UserInfo) => void;
    refreshUserInfo: () => Promise<void>;
    isLoading: boolean;
    googleLogin: () => void;
    handleGoogleCredential: (credential: string) => Promise<void>;
    onLoginSuccess: (callback: () => void) => void;
}

// Create the auth context with a more complete type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an ApolloProviderWithAuth');
    }
    return context;
};

const ApolloProviderWithAuth = ({ children }: any) => {
    const dispatch = useDispatch();
    const [jwt, setJwt] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userInfo, setUserInfoState] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    console.log('isLoading', isLoading)

    const jwtRef = useRef<string>('');
    const isRefreshingRef = useRef(false);
    const hasCheckedAuthRef = useRef(false);
    const loginSuccessCallbackRef = useRef<(() => void) | null>(null);
    const failedQueueRef = useRef<Array<{
        resolve: (value: string) => void;
        reject: (error: any) => void;
    }>>([]);

    const processQueue = (error: any, token: string | null) => {
        failedQueueRef.current.forEach(promise => {
            if (error) {
                promise.reject(error);
            } else {
                promise.resolve(token!);
            }
        });
        failedQueueRef.current = [];
    };

    useEffect(() => {
        jwtRef.current = jwt;
    }, [jwt]);

    const setUserJwt = (token: string) => {
        setJwt(token);
        jwtRef.current = token;
        setIsAuthenticated(!!token);
    };

    const setUserInfo = (info: UserInfo | null) => {
        setUserInfoState(info);
        if (info) {
            // Sync with Redux store
            dispatch(setUser(info));
        } else {
            // Clear Redux store
            dispatch(setUser({ id: null, role: null, name: null, email: null }));
        }
    };

    const refreshUserInfo = async (): Promise<void> => {
        if (!jwt) return;

        console.log('refreshing user info');
        setIsLoading(true);
        try {
            const { data } = await authClient.query<{ me: { data: UserInfo } }>({
                query: ME_QUERY,
                context: {
                    headers: {
                        Authorization: `Bearer ${jwt}`
                    }
                }
            });
            if (data?.me?.data) {
                dispatch(setUser(data.me.data));
                setUserInfo(data.me.data);
            }
        } catch (error) {
            logoutAndClear();
            console.error('Failed to refresh user info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const logoutAndClear = useCallback(async () => {
        console.log('[ApolloProvider] Logging out and clearing all tokens...');
        if (window.location.pathname !== '/login') {
            try {
                // Call backend logout mutation to clear refresh token cookie
                await authClient.mutate({
                    mutation: LOGOUT_MUTATION,
                });
                //how to set local storage item from here?
                localStorage.setItem('onboardingCompleted', 'false');
                console.log('[ApolloProvider] Backend logout successful');
            } catch (error) {
                console.error('[ApolloProvider] Backend logout failed:', error);
                // Continue with local logout even if backend fails
            }

            setIsAuthenticated(false);
            setJwt('');
            jwtRef.current = '';
            setUserInfo(null);
            console.log('[ApolloProvider] Tokens cleared, redirecting to login');
            window.location.href = '/login';
        }
    }, []);

    const onLoginSuccess = useCallback((callback: () => void) => {
        loginSuccessCallbackRef.current = callback;
    }, []);

    // Handle Google credential from GoogleLogin component
    const handleGoogleCredential = useCallback(async (credential: string) => {
        try {
            const { data: loginData } = await authClient.mutate({
                mutation: GOOGLE_LOGIN_MUTATION,
                variables: {
                    input: {
                        credential: credential,
                    }
                }
            });

            const loginResponse = loginData?.googleLogin;
            console.log('[ApolloProvider] Google login response success:', loginResponse?.success);
            if (loginResponse?.success && loginResponse?.data) {
                console.log('[ApolloProvider] Setting user info and tokens from Google login...');
                setUserInfo(loginResponse.data.user);
                setJwt(loginResponse.data.accessToken);
                jwtRef.current = loginResponse.data.accessToken;
                console.log('[ApolloProvider] Access token set in memory (length:', loginResponse.data.accessToken.length + ')');
                // Refresh token is stored in httpOnly secure same-site cookie by backend
                setIsAuthenticated(true);
                console.log('[ApolloProvider] Auth complete, calling success callback');
                // Call the navigation callback instead of full page reload
                if (loginSuccessCallbackRef.current) {
                    loginSuccessCallbackRef.current();
                }
            } else {
                throw new Error(loginResponse?.message || 'Login failed');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            logoutAndClear();
        }
    }, [logoutAndClear]);

    // Google OAuth implicit flow login
    const googleLogin = useGoogleLogin({
        flow: 'implicit',
        onSuccess: async (tokenResponse) => {
            try {
                const { data: loginData } = await authClient.mutate({
                    mutation: GOOGLE_LOGIN_MUTATION,
                    variables: {
                        input: {
                            credential: tokenResponse.access_token,
                        }
                    }
                });

                const loginResponse = loginData?.googleLogin;
                console.log('[ApolloProvider] Google login response success:', loginResponse?.success);
                if (loginResponse?.success && loginResponse?.data) {
                    console.log('[ApolloProvider] Setting user info and tokens from Google login...');
                    setUserInfo(loginResponse.data.user);
                    setJwt(loginResponse.data.accessToken);
                    jwtRef.current = loginResponse.data.accessToken;
                    console.log('[ApolloProvider] Access token set in memory (length:', loginResponse.data.accessToken.length + ')');
                    // Refresh token is stored in httpOnly secure same-site cookie by backend
                    setIsAuthenticated(true);
                    console.log('[ApolloProvider] Auth complete, calling success callback');
                    // Call the navigation callback instead of full page reload
                    if (loginSuccessCallbackRef.current) {
                        loginSuccessCallbackRef.current();
                    }
                } else {
                    throw new Error(loginResponse?.message || 'Login failed');
                }
            } catch (error: any) {
                console.error('Login error:', error);
                logoutAndClear();
            }
        },
        onError: (errorResponse) => {
            console.error('Google login failed:', errorResponse);
        },
    });

    useEffect(() => {
        // On mount: check for refresh token and automatically get new access token
        const checkAuth = async () => {
            // Prevent double execution (React StrictMode)
            if (hasCheckedAuthRef.current) {
                console.log('[ApolloProvider] Auth check already completed, skipping...');
                return;
            }
            hasCheckedAuthRef.current = true;

            console.log('[ApolloProvider] Checking auth on mount...');
            // Refresh token is in httpOnly cookie, backend will handle it automatically
            console.log('[ApolloProvider] Current JWT in memory:', !!jwtRef.current);

            // Try to refresh access token using the cookie
            console.log('[ApolloProvider] Attempting to refresh access token...');
            try {
                const refreshResult = await authClient.mutate<{ refreshToken: { success: boolean; message: string; data?: { accessToken: string; user: UserInfo } } }>({
                    mutation: REFRESH_TOKEN_MUTATION,
                });

                const refreshResponse = refreshResult.data?.refreshToken;
                console.log('[ApolloProvider] Refresh response success:', refreshResponse?.success);

                if (refreshResponse?.success && refreshResponse?.data) {
                    console.log('[ApolloProvider] Token refresh successful, setting new tokens...');
                    // Set access token in memory
                    setJwt(refreshResponse.data.accessToken);
                    jwtRef.current = refreshResponse.data.accessToken;
                    console.log('[ApolloProvider] Access token set in memory (length:', refreshResponse.data.accessToken.length + ')');
                    setIsAuthenticated(true);
                    console.log('[ApolloProvider] Auth state updated: isAuthenticated = true');
                    // Fetch user info with new token
                    console.log('[ApolloProvider] Fetching user info...');
                    try {
                        const { data } = await authClient.query<{ me: { data: UserInfo } }>({
                            query: ME_QUERY,
                            context: {
                                headers: {
                                    Authorization: `Bearer ${refreshResponse.data.accessToken}`
                                }
                            }
                        });
                        if (data?.me?.data) {
                            setUserInfo(data.me.data);
                            console.log('[ApolloProvider] User info fetched successfully');
                        }
                    } catch (userError) {
                        console.error('[ApolloProvider] Failed to fetch user info:', userError);
                    }
                } else {
                    console.warn('[ApolloProvider] Refresh failed:', refreshResponse?.message);
                    // Refresh failed, user is not authenticated
                }
            } catch (error) {
                console.error('[ApolloProvider] Auto refresh failed with error:', error);
                // Refresh failed, user is not authenticated
            }
            console.log('[ApolloProvider] Auth check complete, setting isLoading to false');
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const client = useMemo(() => {
        const uploadLink = createUploadLink({
            uri: GRAPHQL_ENDPOINT,
            credentials: 'include',
        });

        const authLink = setContext((_, { headers }) => {
            return {
                headers: {
                    ...headers,
                    Authorization: jwtRef.current ? `Bearer ${jwtRef.current}` : '',
                },
            };
        });

        const errorLink = onError((errorHandler: any) => {
            const { graphQLErrors, operation, forward } = errorHandler;
            let shouldRetry = false;

            if (graphQLErrors) {
                for (const err of graphQLErrors) {
                    if (
                        err.extensions?.code === 'UNAUTHENTICATED' ||
                        err.message.toLowerCase().includes('jwt expired')
                    ) {
                        shouldRetry = true;
                    }
                }
            }

            if (shouldRetry) {
                const hasRetried = operation.getContext().hasRetried || false;

                if (hasRetried) {
                    console.warn('Already retried this operation, not retrying again.');
                    return;
                }

                return new Observable(observer => {
                    const handleRefresh = async () => {
                        if (isRefreshingRef.current) {
                            try {
                                const newToken = await new Promise<string>((resolve, reject) => {
                                    failedQueueRef.current.push({ resolve, reject });
                                });

                                operation.setContext({
                                    headers: {
                                        ...operation.getContext().headers,
                                        Authorization: `Bearer ${newToken}`,
                                    },
                                    hasRetried: true
                                });

                                const subscriber = forward(operation).subscribe({
                                    next: observer.next.bind(observer),
                                    error: observer.error.bind(observer),
                                    complete: observer.complete.bind(observer),
                                });

                                return () => subscriber.unsubscribe();
                            } catch (error) {
                                observer.error(error);
                                return;
                            }
                        }

                        isRefreshingRef.current = true;

                        try {
                            console.log('[ApolloProvider] Attempting token refresh during request retry...');
                            const refreshResult = await authClient.mutate<{ refreshToken: { success: boolean; message: string; data?: { accessToken: string; user: UserInfo } } }>({
                                mutation: REFRESH_TOKEN_MUTATION,
                            });

                            const refreshResponse = refreshResult.data?.refreshToken;
                            console.log('[ApolloProvider] Token refresh response success:', refreshResponse?.success);

                            if (!refreshResponse?.success || !refreshResponse?.data) {
                                console.warn('[ApolloProvider] Refresh response indicated failure...');
                                throw new Error(refreshResponse?.message || 'Token refresh failed');
                            }

                            const newJwt = refreshResponse.data.accessToken;

                            setJwt(newJwt);
                            jwtRef.current = newJwt;
                            console.log('[ApolloProvider] New access token set in memory (length:', newJwt.length + ')');

                            processQueue(null, newJwt);

                            operation.setContext({
                                headers: {
                                    ...operation.getContext().headers,
                                    Authorization: `Bearer ${newJwt}`,
                                },
                                hasRetried: true
                            });

                            const subscriber = forward(operation).subscribe({
                                next: observer.next.bind(observer),
                                error: observer.error.bind(observer),
                                complete: observer.complete.bind(observer),
                            });

                            return () => subscriber.unsubscribe();
                        } catch (error) {
                            console.error('Token refresh failed:', error);
                            processQueue(error as Error, null);
                            logoutAndClear();
                            observer.error(error);
                        } finally {
                            isRefreshingRef.current = false;
                        }
                    };

                    handleRefresh();
                });
            }
        });

        // WebSocket link for subscriptions with auth
        const wsLink = new GraphQLWsLink(createClient({
            url: GRAPHQL_ENDPOINT.replace('http', 'ws'),
            connectionParams: () => ({
                headers: {
                    Authorization: jwtRef.current ? `Bearer ${jwtRef.current}` : '',
                },
            }),
        }));

        // Split link based on operation type
        const splitLink = split(
            ({ query }) => {
                const definition = getMainDefinition(query);
                return (
                    definition.kind === 'OperationDefinition' &&
                    definition.operation === 'subscription'
                );
            },
            wsLink,
            from([errorLink, authLink, uploadLink])
        );

        return new ApolloClient({
            link: splitLink,
            cache: new InMemoryCache({
                typePolicies: {
                    Subscription: {
                        fields: {
                            livePosts: {
                                // Merge function to handle subscription updates
                                // Initial: all posts from last 24h, Updates: only new posts
                                merge(existing = [], incoming) {
                                    // Create a map of existing posts by ID to avoid duplicates
                                    const postMap = new Map();
                                    existing.forEach((post: any) => {
                                        if (post?.id) postMap.set(post.id, post);
                                    });

                                    // Add incoming posts (will overwrite if same ID = update)
                                    incoming.forEach((post: any) => {
                                        if (post?.id) postMap.set(post.id, post);
                                    });

                                    // Return merged array
                                    return Array.from(postMap.values());
                                },
                            },
                        },
                    },
                },
            }),
        });
    }, [logoutAndClear]);

    const authContextValue: AuthContextType = {
        isAuthenticated,
        userInfo,
        jwt,
        logoutAndClear,
        setUserJwt,
        setUserInfo,
        refreshUserInfo,
        isLoading,
        googleLogin: () => googleLogin(),
        handleGoogleCredential,
        onLoginSuccess,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            <ApolloProvider client={client}>{children}</ApolloProvider>
        </AuthContext.Provider>
    );
};

export default ApolloProviderWithAuth;
