import React, { useEffect, useMemo, useState, createContext, useContext, useRef, useCallback } from 'react';
import { gql } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { useGoogleLogin } from '@react-oauth/google';
import client, { authLinkClient, setAuthToken, setRefreshHandler } from './apolloClient';

// =========================================================================
// 1. EMBEDDED GRAPHQL SCHEMAS & QUERIES (Ground-Truth Contracts)
// =========================================================================

export const GOOGLE_LOGIN_MUTATION = gql`
  mutation LoginWithGoogle($input: GoogleLoginInput!) {
    loginWithGoogle(input: $input) {
      accessToken
      user {
        id
        firstName
        lastName
        email
        profilePhoto
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      user {
        id
        firstName
        lastName
        email
        profilePhoto
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

// =========================================================================
// 2. CORE STRUCTURAL TYPE DEFINITIONS
// =========================================================================

export interface UserInfo {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto?: string;
}

export interface AuthContextType {
    isAuthenticated: boolean;
    userInfo: UserInfo | null;
    jwt: string;
    googleLoginTrigger: () => void;
    logoutAndClear: () => Promise<void>;
    isLoading: boolean;
}

// =========================================================================
// 3. REACT CONTEXT HOOK ENTRY LAYER
// =========================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be executed within an ApolloProviderWithAuth provider tree.');
    }
    return context;
};

// =========================================================================
// 4. PROVIDER WRAPPER ENGINE
//
// NOTE: this component no longer builds the ApolloClient itself. The client
// now lives in apolloClient.ts as a module-level singleton (so syncEngine.ts
// and other non-React code can use it too). This component's only job re:
// Apollo is to keep that singleton's auth state in sync via setAuthToken()
// / setRefreshHandler(), and to render <ApolloProvider client={client}>.
// =========================================================================

export const ApolloProviderWithAuth = ({ children }: { children: React.ReactNode }) => {
    const [jwt, setJwt] = useState<string>('');
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const jwtRef = useRef<string>('');
    const isRefreshingRef = useRef<boolean>(false);
    const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

    useEffect(() => {
        jwtRef.current = jwt;
        setAuthToken(jwt); // keep apolloClient.ts's module-level token in sync
    }, [jwt]);

    const logoutAndClear = useCallback(async () => {
        if (window.location.pathname === '/login') return;

        try {
            await authLinkClient.mutate({ mutation: LOGOUT_MUTATION });
            console.log('[ApolloProvider] Remote session cookie cleared successfully.');
        } catch (error) {
            console.error('[ApolloProvider] Remote logout failed, clearing local state anyway:', error);
        }

        setIsAuthenticated(false);
        setJwt('');
        jwtRef.current = '';
        setAuthToken('');
        setUserInfo(null);
    }, []);

    const executeSilentRefreshSession = useCallback(async (): Promise<string | null> => {
        if (isRefreshingRef.current && refreshPromiseRef.current) {
            return refreshPromiseRef.current;
        }

        isRefreshingRef.current = true;
        refreshPromiseRef.current = (async () => {
            try {
                const { data }: { data: any } = await authLinkClient.mutate({
                    mutation: REFRESH_TOKEN_MUTATION,
                });

                const refreshedData = data?.refreshToken;
                if (refreshedData?.accessToken && refreshedData?.user) {
                    setJwt(refreshedData.accessToken);
                    jwtRef.current = refreshedData.accessToken;
                    setAuthToken(refreshedData.accessToken);
                    setUserInfo(refreshedData.user);
                    setIsAuthenticated(true);
                    return refreshedData.accessToken;
                }
                throw new Error('Refresh response payload returned empty identifiers.');
            } catch (err) {
                console.error('[ApolloProvider] Silent token refresh failed:', err);
                logoutAndClear();
                return null;
            } finally {
                isRefreshingRef.current = false;
                refreshPromiseRef.current = null;
            }
        })();

        return refreshPromiseRef.current;
    }, [logoutAndClear]);

    // Register the refresh handler with apolloClient.ts as soon as we have a
    // stable reference to it, so centralErrorLink can call it on 401s.
    useEffect(() => {
        setRefreshHandler(executeSilentRefreshSession);
    }, [executeSilentRefreshSession]);

    useEffect(() => {
        const initializeSessionState = async () => {
            try {
                await executeSilentRefreshSession();
            } catch {
                logoutAndClear();
            } finally {
                setIsLoading(false);
            }
        };
        initializeSessionState();
    }, [executeSilentRefreshSession, logoutAndClear]);

    const googleLoginTrigger = useGoogleLogin({
        flow: 'auth-code',
        scope: 'openid profile email',
        onSuccess: async (codeResponse) => {
            if (!codeResponse.code) {
                console.error('[ApolloProvider] Google login aborted: no code returned.');
                return;
            }
            setIsLoading(true);
            try {
                const { data }: { data: any } = await authLinkClient.mutate({
                    mutation: GOOGLE_LOGIN_MUTATION,
                    variables: {
                        input: {
                            code: codeResponse.code,
                        }
                    }
                });

                const authResponse = data?.loginWithGoogle;
                if (authResponse?.accessToken && authResponse?.user) {
                    setJwt(authResponse.accessToken);
                    jwtRef.current = authResponse.accessToken;
                    setAuthToken(authResponse.accessToken);
                    setUserInfo(authResponse.user);
                    setIsAuthenticated(true);
                } else {
                    throw new Error('Google OAuth exchange returned a malformed response.');
                }
            } catch (err) {
                console.error('[ApolloProvider] Backend OAuth exchange failed:', err);
                logoutAndClear();
            } finally {
                setIsLoading(false);
            }
        },
        onError: (err) => {
            console.error('[ApolloProvider] Google client login failed:', err);
            logoutAndClear();
        }
    });

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
                <div style={{ textAlign: 'center', color: '#555' }}>
                    <h3>Loading Secure Session...</h3>
                    <p style={{ fontSize: '14px', color: '#888' }}>Checking credentials with your Go backend and Redis server</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, userInfo, jwt, googleLoginTrigger, logoutAndClear, isLoading }}>
            <ApolloProvider client={client}>
                {children}
            </ApolloProvider>
        </AuthContext.Provider>
    );
};