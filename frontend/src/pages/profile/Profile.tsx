import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../config/ApolloProviderWithAuth';

export const ProfilePage = () => {
    const { userInfo } = useAuth();
    const navigate = useNavigate();

    return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h2>Profile Account Details</h2>
                <hr />
                <p><strong>Email:</strong> {userInfo?.email}</p>
                <p><strong>Name:</strong> {userInfo?.firstName} {userInfo?.lastName}</p>

                <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '8px 16px', background: '#4b5563', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Back to Map View
                </button>
            </div>
        </div>
    );
};
