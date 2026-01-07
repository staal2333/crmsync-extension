import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { Button } from '../components/Shared';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export const Success: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch updated user profile after payment
    const refreshUserProfile = async () => {
      if (!token) {
        setIsRefreshing(false);
        return;
      }

      try {
        console.log('🔄 Refreshing user profile after payment...');
        
        // Wait a bit for Stripe webhook to process (optional but helps with race conditions)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const updatedUser = await authService.getProfile(token);
        console.log('✅ Updated user profile:', updatedUser);
        
        updateUser(updatedUser);
        setIsRefreshing(false);
      } catch (error) {
        console.error('❌ Failed to refresh user profile:', error);
        setRefreshError('Could not load updated subscription. Please refresh the page.');
        setIsRefreshing(false);
      }
    };

    refreshUserProfile();
  }, [token]);

  const getTierBadgeColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'pro':
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-purple-100 text-purple-800';
      case 'enterprise':
        return 'bg-gray-900 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl text-center">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-dark">
            Payment Successful!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for subscribing to CRMSYNC. Your account has been upgraded.
          </p>
        </div>

        {/* Show current tier or loading */}
        {isRefreshing ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-blue-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Updating your subscription...</span>
            </div>
          </div>
        ) : refreshError ? (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">{refreshError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-xs text-yellow-900 underline hover:no-underline"
            >
              Refresh Page
            </button>
          </div>
        ) : user?.tier && user.tier !== 'free' ? (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700 mb-2">Your new plan:</p>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${getTierBadgeColor(user.tier)}`}>
              {user.tier} Plan
            </span>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h3 className="font-semibold text-blue-900 flex items-center text-sm mb-2">
              <Download className="h-4 w-4 mr-2" />
              Next Steps
            </h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1 ml-1">
              <li>If you haven't already, install the extension.</li>
              <li>Open Gmail and sign in with this email.</li>
              <li>Your Pro/Business features are now active!</li>
            </ol>
          </div>

          <Button className="w-full" onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}>
            Download Extension
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-xs text-gray-500 mt-4">
            Need help? <a href="mailto:support@crmsync.com" className="text-primary hover:underline">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
};
