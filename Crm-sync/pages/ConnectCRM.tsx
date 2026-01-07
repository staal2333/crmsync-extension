import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://crmsync-api.onrender.com';

export const ConnectCRM: React.FC = () => {
  const [connectedPlatform, setConnectedPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user just returned from OAuth
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const success = params.get('success');
    const platform = params.get('platform');
    const error = params.get('error');
    
    if (success === 'true' && platform) {
      setConnectedPlatform(platform);
      setError('');
    } else if (error) {
      setError(decodeURIComponent(error));
    }
  }, []);

  const handleHubSpotConnect = () => {
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated. Please sign in again.');
      setLoading(false);
      return;
    }

    // Redirect to backend OAuth endpoint with token
    const redirectUri = encodeURIComponent(window.location.origin + '/#/connect-crm?success=true&platform=hubspot');
    window.location.href = `${API_URL}/api/integrations/hubspot/connect?token=${encodeURIComponent(token)}&redirect_uri=${redirectUri}`;
  };

  const handleSalesforceConnect = () => {
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated. Please sign in again.');
      setLoading(false);
      return;
    }

    // Redirect to backend OAuth endpoint with token
    const redirectUri = encodeURIComponent(window.location.origin + '/#/connect-crm?success=true&platform=salesforce');
    window.location.href = `${API_URL}/api/integrations/salesforce/connect?token=${encodeURIComponent(token)}&redirect_uri=${redirectUri}`;
  };

  const handleSkip = () => {
    window.location.hash = '/exclusions';
  };

  const handleContinue = () => {
    window.location.hash = '/exclusions';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '900px',
        width: '100%',
        padding: '60px 80px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            🔐
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Connect your CRM
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            We use secure OAuth. You can revoke access anytime in your CRM.
          </p>
        </div>

        {/* Success Banner */}
        {connectedPlatform && (
          <div style={{
            padding: '16px',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '12px',
            color: '#166534',
            marginBottom: '32px',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✅</span>
            <span>
              Connected to {connectedPlatform === 'hubspot' ? 'HubSpot' : 'Salesforce'} successfully!
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#991b1b',
            marginBottom: '32px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* CRM Tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* HubSpot Tile */}
          <button
            onClick={handleHubSpotConnect}
            disabled={loading || connectedPlatform === 'hubspot'}
            style={{
              padding: '40px 32px',
              background: connectedPlatform === 'hubspot' ? '#f0fdf4' : 'white',
              border: connectedPlatform === 'hubspot' ? '2px solid #86efac' : '2px solid #e5e7eb',
              borderRadius: '16px',
              cursor: connectedPlatform === 'hubspot' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: connectedPlatform === 'hubspot' ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (connectedPlatform !== 'hubspot') {
                e.currentTarget.style.borderColor = '#ff7a59';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 122, 89, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (connectedPlatform !== 'hubspot') {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔵</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              {connectedPlatform === 'hubspot' ? '✓ Connected to HubSpot' : 'Connect HubSpot'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.5'
            }}>
              Sync contacts with your HubSpot CRM
            </p>
          </button>

          {/* Salesforce Tile */}
          <button
            onClick={handleSalesforceConnect}
            disabled={loading || connectedPlatform === 'salesforce'}
            style={{
              padding: '40px 32px',
              background: connectedPlatform === 'salesforce' ? '#f0fdf4' : 'white',
              border: connectedPlatform === 'salesforce' ? '2px solid #86efac' : '2px solid #e5e7eb',
              borderRadius: '16px',
              cursor: connectedPlatform === 'salesforce' ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              opacity: connectedPlatform === 'salesforce' ? 0.8 : 1
            }}
            onMouseEnter={(e) => {
              if (connectedPlatform !== 'salesforce') {
                e.currentTarget.style.borderColor = '#00a1e0';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 161, 224, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (connectedPlatform !== 'salesforce') {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🟠</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              {connectedPlatform === 'salesforce' ? '✓ Connected to Salesforce' : 'Connect Salesforce'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.5'
            }}>
              Sync contacts with your Salesforce CRM
            </p>
          </button>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {connectedPlatform ? (
            <button
              onClick={handleContinue}
              style={{
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              Next: Set up exclusions
            </button>
          ) : (
            <button
              onClick={handleSkip}
              style={{
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '2px solid #e5e7eb',
                background: 'white',
                color: '#64748b'
              }}
            >
              Skip for now (use local contacts only)
            </button>
          )}
        </div>

        {/* Info Text */}
        <p style={{
          marginTop: '24px',
          fontSize: '13px',
          color: '#94a3b8',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          🔒 Your OAuth tokens are encrypted and stored securely. We never access your CRM data without your explicit permission.
        </p>
      </div>
    </div>
  );
};

export default ConnectCRM;
