import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Done: React.FC = () => {
  const { user } = useAuth();
  const [isReturning, setIsReturning] = useState(false);
  const [extensionSynced, setExtensionSynced] = useState(false);

  useEffect(() => {
    // Check if this is a returning user (installing on second device)
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    setIsReturning(params.get('returning') === 'true');
    
    // Sync auth token to extension (if extension is installed)
    syncToExtension();
  }, []);

  const syncToExtension = async () => {
    try {
      const token = localStorage.getItem('token');
      const userDataStr = localStorage.getItem('user');
      
      if (!token || !userDataStr) {
        console.log('⚠️ No auth data to sync to extension');
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      
      console.log('🔄 Preparing to sync auth to extension');
      console.log('- Email:', userData.email);
      console.log('- Name:', userData.name);
      
      // Build callback URL to extension
      const extensionId = (window as any).chrome?.runtime?.id || 'EXTENSION_ID';
      const callbackUrl = `chrome-extension://${extensionId}/auth-callback.html?` +
        `token=${encodeURIComponent(token)}` +
        `&email=${encodeURIComponent(userData.email)}` +
        `&name=${encodeURIComponent(userData.name || '')}` +
        `&tier=${encodeURIComponent(userData.tier || 'free')}`;
      
      console.log('✅ Auth callback URL ready');
      
      // Store URL for the button to use
      (window as any).authCallbackUrl = callbackUrl;
      setExtensionSynced(true);
    } catch (error) {
      console.error('Failed to prepare auth sync:', error);
    }
  };

  const handleOpenExtension = () => {
    const callbackUrl = (window as any).authCallbackUrl;
    if (callbackUrl) {
      // Open the extension auth callback page
      window.open(callbackUrl, '_blank');
      
      // Show a brief message
      setTimeout(() => {
        handleOpenGmail();
      }, 1000);
    } else {
      // Fallback: just open Gmail
      handleOpenGmail();
    }
  };

  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank');
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
        padding: '60px 80px',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{
          width: '120px',
          height: '120px',
          margin: '0 auto 32px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '64px',
          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.3)',
          animation: 'scaleIn 0.5s ease-out'
        }}>
          ✓
        </div>

        {/* Header */}
        <h1 style={{
          fontSize: '40px',
          fontWeight: 700,
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isReturning ? 'Welcome Back!' : 'You\'re all set!'}
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          lineHeight: '1.6',
          marginBottom: '40px'
        }}>
          {isReturning 
            ? 'CRM Sync is now installed on this device. Your settings and exclusions have been synced!'
            : 'CRM Sync is now active in your Gmail. Open Gmail to start detecting contacts automatically!'
          }
        </p>

        {/* Summary Box */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
          border: '2px solid #a5b4fc',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '40px',
          textAlign: 'left'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#1e293b',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            🎉 What's Configured
          </h3>
          
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <li style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <div>
                <strong style={{ color: '#1e293b', fontSize: '15px' }}>Your CRM-Sync account is ready</strong>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Signed in as {user?.email}
                </p>
              </div>
            </li>
            
            <li style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <div>
                <strong style={{ color: '#1e293b', fontSize: '15px' }}>Your CRM is connected</strong>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Ready to sync contacts automatically
                </p>
              </div>
            </li>
            
            <li style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <div>
                <strong style={{ color: '#1e293b', fontSize: '15px' }}>Your exclusions are active</strong>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                  We'll ignore you, your team, and internal domains on all devices
                </p>
              </div>
            </li>
            
            <li style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>✓</span>
              <div>
                <strong style={{ color: '#1e293b', fontSize: '15px' }}>Chrome extension installed</strong>
                <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0 0' }}>
                  Contact detection is ready in Gmail
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* What Happens Next */}
        <div style={{
          background: '#fef3c7',
          border: '2px solid #fcd34d',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#92400e',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '20px' }}>💡</span>
            What happens when you open Gmail
          </h4>
          <ul style={{
            listStyle: 'disc',
            paddingLeft: '28px',
            margin: 0,
            color: '#92400e',
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            <li>When you open an email from an external contact, CRM-Sync will detect their info</li>
            <li>A widget will appear with their name, email, company, and phone</li>
            <li>You can instantly sync them to your CRM with one click</li>
            <li>Your exclusions are already working—internal emails won't be tracked</li>
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleOpenExtension}
          style={{
            width: '100%',
            padding: '20px 32px',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
          }}
        >
          <span style={{ fontSize: '24px' }}>📧</span>
          <span>Open Gmail & Start Syncing</span>
        </button>

        {/* Footer Note */}
        <p style={{
          marginTop: '24px',
          fontSize: '13px',
          color: '#94a3b8',
          lineHeight: '1.6'
        }}>
          Your settings will sync across all devices where you sign in to CRM-Sync.
          <br />
          Need help? Visit our <a href="/support" style={{ color: '#667eea', textDecoration: 'underline' }}>support page</a> or email support@crm-sync.net
        </p>

        <style>{`
          @keyframes scaleIn {
            from {
              transform: scale(0.5);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Done;
