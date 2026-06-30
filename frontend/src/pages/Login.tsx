import React from 'react';
import { useAuth } from '../config/ApolloProviderWithAuth'; // 👈 Adjust this path matching your file setup

export const Login = () => {
    // 🔑 Extract the bouncer states and trigger functions directly from the core context
    const { googleLoginTrigger, isLoading, isAuthenticated, userInfo } = useAuth();

    return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>Welcome Back</h2>
            <p>Please connect your Google account to access your system dashboard feed.</p>

            {/* 1. Condition: Evaluate if user identity mapping successfully exists in memory */}
            {isAuthenticated && userInfo ? (
                <div style={{ marginTop: '20px', padding: '15px', background: '#eef6ff', borderRadius: '8px' }}>
                    <img
                        src={userInfo.profilePhoto}
                        alt="Profile Avatar"
                        style={{ borderRadius: '50%', width: '64px', height: '64px', marginBottom: '10px' }}
                    />
                    <p style={{ margin: 0 }}>Logged in as:</p>
                    <strong>{userInfo.firstName} {userInfo.lastName}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: '#666' }}>{userInfo.email}</span>
                </div>
            ) : (
                /* 2. Condition: Render active interactive submit layouts if logged out */
                <button
                    onClick={() => googleLoginTrigger()}
                    /* ⏳ USING THE LOADING STATE: Disables the button instantly while backend talks to Go/Redis */
                    disabled={isLoading}
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        background: isLoading ? '#a0c3ff' : '#4285F4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s ease'
                    }}
                >
                    {/* Dynamic label swaps based on the centralized engine states */}
                    {isLoading ? 'Verifying Session with Go & Redis...' : 'Sign in with Google'}
                </button>
            )}
        </div>
    );
};
