import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button, SectionHeader } from '../components/Shared';
import { User, CreditCard, LogOut, Calendar, DollarSign, Mail, Globe, Shield, Activity, Database, Download } from 'lucide-react';
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader title="My Account" subtitle="Manage your profile, subscription, and usage" align="left" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Profile & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Profile Card */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-dark">{user.name}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  <div className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(userTier)}`}>
                    {displayTier} {userTier.toLowerCase() !== 'free' ? 'Plan' : 'Tier'}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Email Address
                  </label>
                  <div className="text-base text-dark font-medium">{user.email}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Member Since
                  </label>
                  <div className="text-base text-dark font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    <Shield className="w-3 h-3 inline mr-1" />
                    Account Status
                  </label>
                  <div className="text-base">
                    <span className="inline-flex items-center text-green-600 font-medium">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      Active
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    <Activity className="w-3 h-3 inline mr-1" />
                    Subscription Status
                  </label>
                  <div className="text-base text-dark font-medium capitalize">
                    {user.subscriptionStatus || 'Active'}
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Stats Card */}
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 p-8 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-dark mb-6 flex items-center">
                <Database className="w-5 h-5 mr-2 text-primary" />
                Usage & Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {userTier.toLowerCase() === 'free' ? '0/50' : 'Unlimited'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Contacts Synced</div>
                  {userTier.toLowerCase() === 'free' && (
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  )}
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {userTier.toLowerCase() === 'free' ? '1/week' : 'Unlimited'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">CSV Exports</div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-accent mb-2">
                    {userTier.toLowerCase() !== 'free' ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">CRM Integrations</div>
                  {userTier.toLowerCase() === 'free' && (
                    <button 
                      onClick={() => onNavigate('pricing')}
                      className="mt-2 text-xs text-primary hover:underline font-medium"
                    >
                      Upgrade to unlock
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Subscription */}
          <div className="space-y-6">
            {/* Subscription Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-secondary" />
                Subscription
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Current Plan</span>
                  <div className={`mt-2 px-4 py-3 rounded-lg text-center ${getTierBadgeColor(userTier)}`}>
                    <div className="text-lg font-bold">
                      {displayTier} {userTier.toLowerCase() !== 'free' ? 'Plan' : 'Tier'}
                    </div>
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
                      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex items-center">
                        <span className="mr-2">🎉</span>
                        Trial ends {new Date(billingDetails.subscription.trialEnd).toLocaleDateString()}
                      </div>
                    )}
                    
                    {/* Cancel Warning */}
                    {billingDetails.subscription.cancelAtPeriodEnd && (
                      <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-700 flex items-center">
                        <span className="mr-2">⚠️</span>
                        Cancels {new Date(billingDetails.subscription.currentPeriodEnd).toLocaleDateString()}
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

            {/* Quick Actions Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-dark mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => onNavigate('register')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                >
                  <Globe className="w-4 h-4 mr-3 text-primary" />
                  <span className="font-medium">View Onboarding</span>
                </button>
                <button 
                  onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-3 text-secondary" />
                  <span className="font-medium">Install Extension</span>
                </button>
                {userTier.toLowerCase() === 'free' && (
                  <button 
                    onClick={() => onNavigate('pricing')}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-colors flex items-center text-sm border border-primary/20"
                  >
                    <Activity className="w-4 h-4 mr-3 text-primary" />
                    <span className="font-medium text-primary">Unlock Pro Features</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};