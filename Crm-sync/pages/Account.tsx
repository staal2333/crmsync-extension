import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, SectionHeader } from '../components/Shared';
import { User, CreditCard, LogOut, Calendar, DollarSign } from 'lucide-react';
import { getSubscriptionDetails, createPortalSession } from '../services/stripeService';

export const Account: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, logout, isLoading } = useAuth();
  const [billingDetails, setBillingDetails] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  // Get tier from user (must be before conditional returns to satisfy Rules of Hooks)
  const userTier = user?.subscriptionTier || user?.tier || user?.plan || 'free';
  const displayTier = userTier.charAt(0).toUpperCase() + userTier.slice(1).toLowerCase();
  
  // Memoized billing details loader
  const loadBillingDetails = useCallback(async () => {
    if (userTier.toLowerCase() === 'free') return; // Skip for free tier
    
    setLoadingBilling(true);
    try {
      const details = await getSubscriptionDetails();
      setBillingDetails(details);
    } catch (error) {
      console.error('Failed to load billing details:', error);
    } finally {
      setLoadingBilling(false);
    }
  }, [userTier]); // Only re-create if userTier changes
  
  // Load billing details on mount (for paid tiers only)
  useEffect(() => {
    if (user && userTier.toLowerCase() !== 'free') {
      loadBillingDetails();
    }
  }, [user, userTier, loadBillingDetails]);
  
  const handleManageBilling = async () => {
    try {
      const result = await createPortalSession();
      if (result?.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Unable to open billing portal. Please try again.');
    }
  };

  // Show loading while auth is initializing (after all hooks!)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Only redirect to login after loading is complete and user is not found
  if (!user) {
    onNavigate('login');
    return null;
  }
  
  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'pro':
      case 'professional':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'business':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'enterprise':
        return 'bg-gradient-to-r from-gray-800 to-gray-900 text-white';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="My Account" align="left" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Profile Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <div className="mt-1 text-lg text-dark">{user.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                <div className="mt-1 text-lg text-dark">{user.email}</div>
              </div>
              <div className="pt-4">
                 <Button variant="outline" size="sm" onClick={() => logout()}>
                   <LogOut className="w-4 h-4 mr-2" />
                   Sign Out
                 </Button>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-secondary" />
              Subscription
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500">Current Plan</span>
                <div className={`mt-2 px-4 py-2 rounded-lg text-center ${getTierBadgeColor(userTier)}`}>
                  <div className="text-lg font-bold">
                    {displayTier} {userTier.toLowerCase() !== 'free' ? 'Plan' : 'Tier'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center uppercase tracking-wide">
                  {user.subscriptionStatus || 'Active'}
                </div>
              </div>
              
              {/* Billing Details for Paid Plans */}
              {userTier.toLowerCase() !== 'free' && billingDetails?.subscription && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  {/* Billing Period */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Billing</span>
                    <span className="text-sm font-medium">
                      {billingDetails.subscription.interval === 'month' ? 'Monthly' : 'Yearly'}
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex items-center">
                      <DollarSign className="w-3 h-3" />
                      Price
                    </span>
                    <span className="text-sm font-medium">
                      ${billingDetails.subscription.amount.toFixed(2)}/{billingDetails.subscription.interval}
                    </span>
                  </div>
                  
                  {/* Next Billing Date */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Next Bill
                    </span>
                    <span className="text-sm font-medium">
                      {new Date(billingDetails.subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {/* Payment Method */}
                  {billingDetails.paymentMethod && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Card</span>
                      <span className="text-sm font-medium">
                        {billingDetails.paymentMethod.brand.toUpperCase()} •••• {billingDetails.paymentMethod.last4}
                      </span>
                    </div>
                  )}
                  
                  {/* Trial Warning */}
                  {billingDetails.subscription.trialEnd && new Date(billingDetails.subscription.trialEnd) > new Date() && (
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
                      🎉 Trial ends {new Date(billingDetails.subscription.trialEnd).toLocaleDateString()}
                    </div>
                  )}
                  
                  {/* Cancel Warning */}
                  {billingDetails.subscription.cancelAtPeriodEnd && (
                    <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-700">
                      ⚠️ Cancels {new Date(billingDetails.subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              {userTier.toLowerCase() === 'free' && (
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => onNavigate('pricing')}
                >
                  Upgrade Plan
                </Button>
              )}
              
              {userTier.toLowerCase() !== 'free' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageBilling}
                >
                  Manage Billing
                </Button>
              )}
              
              {loadingBilling && (
                <div className="text-xs text-center text-gray-400">
                  Loading billing info...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};