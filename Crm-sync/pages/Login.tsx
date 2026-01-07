import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Button, LogoIcon } from '../components/Shared';

export const Login: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExtensionLogin, setIsExtensionLogin] = useState(false);
  const [extensionId, setExtensionId] = useState('');
  const { login } = useAuth();

  // Check if this is a login from the extension
  useEffect(() => {
    // Try to get params from both search (before hash) and hash (after hash)
    // URL format: https://site.com?source=extension&extensionId=abc#/login
    let urlParams = new URLSearchParams(window.location.search);
    
    // Debug logging
    console.log('Full URL:', window.location.href);
    console.log('Search params:', window.location.search);
    console.log('Hash:', window.location.hash);
    
    let source = urlParams.get('source');
    let extId = urlParams.get('extensionId');
    
    // If not found in search, check if they're in the hash
    if (!source || !extId) {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        urlParams = new URLSearchParams(hashParts[1]);
        source = urlParams.get('source');
        extId = urlParams.get('extensionId');
      }
    }
    
    console.log('Parsed params:', { source, extId });
    
    // Clean up extension ID (trim and remove trailing slashes)
    const cleanExtId = extId?.trim().replace(/\/+$/, '');
    
    if (source === 'extension' && cleanExtId && cleanExtId !== 'null' && cleanExtId !== 'undefined' && cleanExtId.length > 10) {
      setIsExtensionLogin(true);
      setExtensionId(cleanExtId);
      console.log('✅ Extension login detected, ID:', cleanExtId);
    } else {
      console.log('❌ Not an extension login or missing ID', { source, cleanExtId });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      login(data.token, data.user);
      
      // If logging in from extension, redirect back to extension
      if (isExtensionLogin && extensionId) {
        redirectToExtension(data);
      } else {
        // Normal redirect to account page
        onNavigate('account');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToExtension = (authData: any) => {
    const { token, user } = authData;
    
    // Validate extension ID
    if (!extensionId || extensionId === 'null' || extensionId === 'undefined' || extensionId.length < 10) {
      console.error('❌ Invalid extension ID:', extensionId);
      setError('Invalid extension ID. Please try signing in from the extension again.');
      return;
    }
    
    // Build callback URL with all auth data
    const params = new URLSearchParams({
      token: token,
      email: user.email,
      name: user.name || '',
      tier: user.tier || user.plan || 'free',
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    });

    const callbackUrl = `chrome-extension://${extensionId}/auth-callback.html?${params.toString()}`;
    
    console.log('🚀 Redirecting to extension:', callbackUrl);
    console.log('Extension ID:', extensionId);
    console.log('Auth data:', { email: user.email, tier: user.tier || user.plan || 'free' });
    
    // Small delay to show success message
    setTimeout(() => {
      window.location.href = callbackUrl;
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
             <LogoIcon className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-dark">Sign in to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or <span onClick={() => onNavigate('register')} className="font-medium text-primary hover:text-primary-dark cursor-pointer">create a new account</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {isExtensionLogin && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm p-3 rounded-lg flex items-center gap-2">
              <span>🔌</span>
              <span>Logging in from CRMSYNC Extension</span>
            </div>
          )}
          {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
};