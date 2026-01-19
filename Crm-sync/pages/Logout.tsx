import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Logout Page
 * Automatically logs the user out and redirects to home
 */
export default function Logout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('🚪 Logging out from website...');
        
        // Call logout from AuthContext
        await logout();
        
        console.log('✅ Logged out successfully');
        
        // Wait a moment to ensure logout completes
        setTimeout(() => {
          // Redirect to home page
          navigate('/', { replace: true });
          
          // Show a brief message
          const message = document.createElement('div');
          message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
          `;
          message.textContent = '✅ You have been signed out';
          document.body.appendChild(message);
          
          setTimeout(() => {
            message.remove();
          }, 3000);
        }, 500);
      } catch (error) {
        console.error('❌ Logout error:', error);
        // Still redirect even if there's an error
        navigate('/', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Signing you out...</h2>
        <p className="text-gray-600 mt-2">Please wait</p>
      </div>
    </div>
  );
}
