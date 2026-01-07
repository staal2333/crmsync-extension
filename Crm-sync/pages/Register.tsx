import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Button, LogoIcon } from '../components/Shared';

export const Register: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  
  // Extension integration
  const [isExtensionRegister, setIsExtensionRegister] = useState(false);
  const [extensionId, setExtensionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if registering from extension
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
    
    const source = urlParams.get('source') || hashParams.get('source');
    let extId = urlParams.get('extensionId') || hashParams.get('extensionId');
    
    // Clean extension ID (remove trailing slashes/whitespace)
    if (extId) {
      extId = extId.trim().replace(/\s*\/+$/, '');
    }
    
    console.log('🔍 Register - Source:', source, 'Extension ID:', extId);
    
    if (source === 'extension' && extId) {
      setIsExtensionRegister(true);
      setExtensionId(extId);
      console.log('✅ Extension registration detected, ID:', extId);
    }
  }, []);

  const redirectToExtension = (token: string, user: any) => {
    if (!extensionId || !isExtensionRegister) return;
    
    const firstName = user.firstName || user.first_name || '';
    const lastName = user.lastName || user.last_name || '';
    const userEmail = user.email || '';
    const userName = user.name || `${firstName} ${lastName}`.trim();
    const tier = user.tier || 'free';
    
    const callbackUrl = `chrome-extension://${extensionId}/auth-callback.html?` + 
      `token=${encodeURIComponent(token)}` +
      `&email=${encodeURIComponent(userEmail)}` +
      `&name=${encodeURIComponent(userName)}` +
      `&tier=${encodeURIComponent(tier)}` +
      `&firstName=${encodeURIComponent(firstName)}` +
      `&lastName=${encodeURIComponent(lastName)}`;
    
    console.log('🚀 Redirecting to extension:', callbackUrl);
    console.log('Extension ID:', extensionId);
    console.log('Auth data:', { email: userEmail, name: userName, tier });
    
    window.location.href = callbackUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await authService.register(name, email, password);
      login(data.token, data.user);
      
      // If coming from extension, redirect back
      if (isExtensionRegister && extensionId) {
        redirectToExtension(data.token, data.user);
      } else {
        onNavigate('account');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
             <LogoIcon className="h-12 w-12" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-dark">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account? <span onClick={() => onNavigate('login')} className="font-medium text-primary hover:text-primary-dark cursor-pointer">Sign in</span>
          </p>
          {isExtensionRegister && (
            <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                🔌 Registering from CRMSYNC Extension
              </p>
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg">{error}</div>}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <input
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
};