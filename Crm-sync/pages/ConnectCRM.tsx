import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://crmsync-api.onrender.com';

export const ConnectCRM: React.FC = () => {
  const [connectedPlatform, setConnectedPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTrialModal, setShowTrialModal] = useState(false);

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
    // Check if user has Pro tier
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const tier = user.subscriptionTier || user.tier || 'free';
      
      if (tier.toLowerCase() === 'free') {
        // Show trial modal for free users
        setShowTrialModal(true);
        return;
      }
    }
    
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
    // Check if user has Pro tier
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const tier = user.subscriptionTier || user.tier || 'free';
      
      if (tier.toLowerCase() === 'free') {
        // Show trial modal for free users
        setShowTrialModal(true);
        return;
      }
    }
    
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
            <div style={{ position: 'relative' }}>
              {/* Pro Badge */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
              }}>
                PRO
              </div>
              
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
            </div>
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
            <div style={{ position: 'relative' }}>
              {/* Pro Badge */}
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '10px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
              }}>
                PRO
              </div>
              
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
            </div>
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

      {/* Trial Modal */}
      {showTrialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowTrialModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '48px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🚀</div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 700,
                marginBottom: '12px',
                color: '#1e293b'
              }}>
                CRM Integration Requires Pro
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#64748b',
                lineHeight: '1.6'
              }}>
                Connect to HubSpot & Salesforce with automatic contact syncing
              </p>
            </div>

            <div style={{
              background: '#f0fdf4',
              border: '2px solid #86efac',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '24px', marginRight: '12px' }}>✨</span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#166534'
                }}>
                  Start 14-Day Free Trial
                </span>
              </div>
              <p style={{
                fontSize: '14px',
                color: '#166534',
                lineHeight: '1.6'
              }}>
                Full access to Pro features. No credit card required. Cancel anytime.
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                fontWeight: 600,
                marginBottom: '12px'
              }}>
                Pro Plan Includes:
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                {[
                  'Unlimited contacts',
                  'HubSpot & Salesforce sync',
                  'Auto-sync every 15 minutes',
                  'Smart duplicate detection',
                  'Priority support'
                ].map((feature, i) => (
                  <li key={i} style={{
                    padding: '8px 0',
                    fontSize: '14px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  window.location.hash = '/pricing';
                }}
                style={{
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                Start Free Trial → $9.99/mo after trial
              </button>
              
              <button
                onClick={() => setShowTrialModal(false)}
                style={{
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  color: '#64748b',
                  transition: 'all 0.3s ease'
                }}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectCRM;
