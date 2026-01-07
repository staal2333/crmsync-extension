import React, { useState } from 'react';

const CHROME_WEB_STORE_URL = 'https://chrome.google.com/webstore/detail/crmsync/YOUR_EXTENSION_ID';

export const Install: React.FC = () => {
  const [installed, setInstalled] = useState(false);

  const handleInstallClick = () => {
    window.open(CHROME_WEB_STORE_URL, '_blank');
    // Optimistically assume user will install
    setTimeout(() => setInstalled(true), 2000);
  };

  const handleContinue = () => {
    window.location.hash = '/done';
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
        maxWidth: '800px',
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
            ⚡
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Install the CRM-Sync Chrome extension
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            This is what lets us detect contacts directly in Gmail.
          </p>
        </div>

        {/* Installation Steps */}
        <div style={{ marginBottom: '40px' }}>
          {/* Step 1 */}
          <div style={{
            display: 'flex',
            gap: '20px',
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              1
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Click "Install extension"
              </h3>
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>
                This will open the Chrome Web Store in a new tab.
              </p>
              <button
                onClick={handleInstallClick}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                🚀 Install extension
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{
            display: 'flex',
            gap: '20px',
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '16px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '20px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              2
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Click "Add to Chrome"
              </h3>
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                lineHeight: '1.6'
              }}>
                In the Chrome Web Store, click the blue "Add to Chrome" button and confirm when prompted.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{
            display: 'flex',
            gap: '20px',
            padding: '24px',
            background: '#f8fafc',
            borderRadius: '16px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '20px',
              fontWeight: 700,
              flexShrink: 0
            }}>
              3
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Pin CRM-Sync to your toolbar
              </h3>
              <p style={{
                fontSize: '15px',
                color: '#64748b',
                lineHeight: '1.6'
              }}>
                Click the puzzle piece icon in Chrome's toolbar, find CRM-Sync, and click the pin icon for quick access.
              </p>
            </div>
          </div>
        </div>

        {/* Visual Guide Placeholder */}
        <div style={{
          padding: '40px',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
          borderRadius: '16px',
          border: '2px dashed #a5b4fc',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎬</div>
          <p style={{
            fontSize: '15px',
            color: '#475569',
            lineHeight: '1.6'
          }}>
            <strong>Quick tip:</strong> Look for the CRM-Sync icon in your browser toolbar after installation. It should appear in the top-right corner.
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!installed}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: installed ? 'pointer' : 'not-allowed',
            border: 'none',
            background: installed ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e1',
            color: 'white',
            boxShadow: installed ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
            transition: 'all 0.3s'
          }}
        >
          {installed ? '✓ I\'ve installed the extension' : 'Install the extension first'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={handleContinue}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Continue anyway
          </button>
        </div>

        {/* Info Box */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          💡 <strong>Having trouble?</strong> Make sure you're using Google Chrome (not Edge, Firefox, or Safari). The extension only works in Chrome-based browsers.
        </div>
      </div>
    </div>
  );
};

export default Install;
