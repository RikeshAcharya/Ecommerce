import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuth: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const access = params.get('access');
    const refresh = params.get('refresh');

    if (access && refresh) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      navigate('/dashboard', { replace: true });
    } else {
      setError('OAuth authentication failed. No tokens received.');
    }
  }, [navigate]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <h2>OAuth Authentication Failed</h2>
        <p style={{ color: 'red' }}>{error}</p>
        <p>
          <a href="/login">Back to Login</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h2>OAuth Authentication</h2>
      <p>Processing your OAuth login...</p>
    </div>
  );
};

export default OAuth;
