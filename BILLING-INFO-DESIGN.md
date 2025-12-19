# 💳 Enhanced Billing & Account Information Design

## 🎯 Overview
Add comprehensive billing, payment, and usage information to the Account page for better transparency and user control.

---

## 📋 **Enhanced Account Page Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        My Account                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────┐  ┌─────────────────────────────┐   │
│  │  👤 Profile Details    │  │  💳 Subscription            │   │
│  │                        │  │                             │   │
│  │  Name: John Doe        │  │  Plan: PRO PLAN             │   │
│  │  Email: john@email.com │  │  Status: ● Active           │   │
│  │  Joined: Dec 15, 2024  │  │  Billing: Monthly           │   │
│  │                        │  │  Price: $29/month           │   │
│  │  [Sign Out]            │  │  Next Bill: Jan 15, 2025    │   │
│  │                        │  │  Payment: •••• 4242         │   │
│  │                        │  │                             │   │
│  │                        │  │  [Upgrade Plan]             │   │
│  │                        │  │  [Manage Billing]           │   │
│  └────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📊 Usage Statistics                                      │   │
│  │                                                           │   │
│  │  Contacts:  50 / Unlimited  [███████░░░] 50%             │   │
│  │  Exports:   3 / Unlimited   [██░░░░░░░░] 30%             │   │
│  │  Storage:   2.3 MB / 1 GB   [░░░░░░░░░░] 2%              │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  📜 Billing History                                       │   │
│  │                                                           │   │
│  │  Date          Amount    Status      Invoice              │   │
│  │  Dec 15, 2024  $29.00    ✅ Paid     [Download PDF]       │   │
│  │  Nov 15, 2024  $29.00    ✅ Paid     [Download PDF]       │   │
│  │  Oct 15, 2024  $29.00    ✅ Paid     [Download PDF]       │   │
│  │                                                           │   │
│  │  [View All Invoices]                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Implementation Plan:**

### **Phase 1: Backend API Enhancements**

#### **1. Add Subscription Info Endpoint**
**File:** `crmsync-backend/src/routes/subscription.js`

```javascript
// GET /api/subscription/details
// Returns comprehensive subscription information
router.get('/details', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      `SELECT 
        subscription_tier,
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_expires_at,
        trial_ends_at,
        contact_limit,
        created_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );
    
    const userData = user.rows[0];
    
    // Get Stripe subscription details
    let subscriptionDetails = null;
    if (userData.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(
        userData.stripe_subscription_id
      );
      
      subscriptionDetails = {
        interval: subscription.items.data[0].plan.interval, // 'month' or 'year'
        intervalCount: subscription.items.data[0].plan.interval_count,
        amount: subscription.items.data[0].plan.amount / 100,
        currency: subscription.items.data[0].plan.currency,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
      };
    }
    
    // Get payment method
    let paymentMethod = null;
    if (userData.stripe_customer_id) {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: userData.stripe_customer_id,
        type: 'card',
      });
      
      if (paymentMethods.data.length > 0) {
        const pm = paymentMethods.data[0];
        paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expiryMonth: pm.card.exp_month,
          expiryYear: pm.card.exp_year
        };
      }
    }
    
    res.json({
      tier: userData.subscription_tier,
      status: userData.subscription_status,
      contactLimit: userData.contact_limit,
      accountCreated: userData.created_at,
      subscription: subscriptionDetails,
      paymentMethod: paymentMethod,
      trialEndsAt: userData.trial_ends_at
    });
    
  } catch (error) {
    next(error);
  }
});
```

#### **2. Add Billing History Endpoint**
```javascript
// GET /api/subscription/invoices
// Returns invoice history
router.get('/invoices', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user.rows[0].stripe_customer_id) {
      return res.json({ invoices: [] });
    }
    
    const invoices = await stripe.invoices.list({
      customer: user.rows[0].stripe_customer_id,
      limit: 10
    });
    
    const formattedInvoices = invoices.data.map(inv => ({
      id: inv.id,
      date: new Date(inv.created * 1000),
      amount: inv.amount_paid / 100,
      currency: inv.currency,
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      hostedUrl: inv.hosted_invoice_url
    }));
    
    res.json({ invoices: formattedInvoices });
    
  } catch (error) {
    next(error);
  }
});
```

#### **3. Create Stripe Portal Session**
```javascript
// POST /api/subscription/create-portal
// Create Stripe Customer Portal session for managing billing
router.post('/create-portal', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const user = await db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user.rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'No subscription found' });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: user.rows[0].stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/#/account`,
    });
    
    res.json({ url: session.url });
    
  } catch (error) {
    next(error);
  }
});
```

---

### **Phase 2: Frontend Enhancement**

#### **1. Create New Components**

**File:** `Crm-sync/components/BillingInfo.tsx` (NEW)
```typescript
import React, { useEffect, useState } from 'react';
import { CreditCard, Calendar, DollarSign } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';

interface BillingInfoProps {
  user: any;
}

export const BillingInfo: React.FC<BillingInfoProps> = ({ user }) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, []);

  const loadDetails = async () => {
    try {
      const data = await subscriptionService.getSubscriptionDetails();
      setDetails(data);
    } catch (error) {
      console.error('Failed to load billing details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const { url } = await subscriptionService.createPortalSession();
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!details?.subscription) return null;

  const { subscription, paymentMethod } = details;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2 text-secondary" />
        Billing Information
      </h3>
      
      <div className="space-y-4">
        {/* Billing Period */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Billing Period</span>
          <span className="font-medium">
            {subscription.interval === 'month' ? 'Monthly' : 'Yearly'}
          </span>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Price</span>
          <span className="font-medium">
            ${subscription.amount}/{subscription.interval}
          </span>
        </div>

        {/* Next Billing Date */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            Next Billing Date
          </span>
          <span className="font-medium">
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </span>
        </div>

        {/* Payment Method */}
        {paymentMethod && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Payment Method</span>
            <span className="font-medium">
              {paymentMethod.brand.toUpperCase()} •••• {paymentMethod.last4}
            </span>
          </div>
        )}

        {/* Trial Info */}
        {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-700">
              🎉 Trial ends on {new Date(subscription.trialEnd).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Cancel Warning */}
        {subscription.cancelAtPeriodEnd && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-sm text-yellow-700">
              ⚠️ Subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Manage Button */}
        <button
          onClick={handleManageBilling}
          className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Manage Billing & Payment
        </button>
      </div>
    </div>
  );
};
```

**File:** `Crm-sync/components/UsageStats.tsx` (NEW)
```typescript
import React from 'react';
import { Users, FileDown, Database } from 'lucide-react';

interface UsageStatsProps {
  contactCount: number;
  contactLimit: number;
  exportCount: number;
  exportLimit: number;
}

export const UsageStats: React.FC<UsageStatsProps> = ({
  contactCount,
  contactLimit,
  exportCount,
  exportLimit
}) => {
  const contactPercent = contactLimit === -1 ? 0 : (contactCount / contactLimit) * 100;
  const exportPercent = exportLimit === -1 ? 0 : (exportCount / exportLimit) * 100;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
        <Database className="w-5 h-5 mr-2 text-primary" />
        Usage Statistics
      </h3>
      
      <div className="space-y-4">
        {/* Contacts */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Contacts
            </span>
            <span className="text-sm font-medium">
              {contactCount} / {contactLimit === -1 ? 'Unlimited' : contactLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: contactLimit === -1 ? '0%' : `${Math.min(contactPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Exports */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600 flex items-center">
              <FileDown className="w-4 h-4 mr-1" />
              Exports This Month
            </span>
            <span className="text-sm font-medium">
              {exportCount} / {exportLimit === -1 ? 'Unlimited' : exportLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: exportLimit === -1 ? '0%' : `${Math.min(exportPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

**File:** `Crm-sync/components/BillingHistory.tsx` (NEW)
```typescript
import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';

export const BillingHistory: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await subscriptionService.getInvoices();
      setInvoices(data.invoices);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (invoices.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-dark mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-primary" />
        Billing History
      </h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">Date</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-b-0">
                <td className="py-3">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="py-3">${invoice.amount.toFixed(2)}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {invoice.status === 'paid' ? '✅ Paid' : '❌ Failed'}
                  </span>
                </td>
                <td className="py-3">
                  <a 
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

#### **2. Update Account Page**

**File:** `Crm-sync/pages/Account.tsx` (ENHANCED)
```typescript
// Add imports
import { BillingInfo } from '../components/BillingInfo';
import { UsageStats } from '../components/UsageStats';
import { BillingHistory } from '../components/BillingHistory';

// In the component JSX, replace the current layout with:
<div className="min-h-screen bg-gray-50 py-12">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <SectionHeader title="My Account" align="left" />
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Profile Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* Existing profile content */}
      </div>

      {/* Subscription Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* Existing subscription content */}
      </div>
      
      {/* NEW: Billing Info Card */}
      <BillingInfo user={user} />
    </div>
    
    {/* NEW: Usage Stats */}
    <div className="mb-6">
      <UsageStats 
        contactCount={50}
        contactLimit={-1}
        exportCount={3}
        exportLimit={-1}
      />
    </div>
    
    {/* NEW: Billing History */}
    <BillingHistory />
  </div>
</div>
```

#### **3. Add Service Methods**

**File:** `Crm-sync/services/subscriptionService.ts` (ADD)
```typescript
// Add to existing service
export const subscriptionService = {
  // ... existing methods ...
  
  async getSubscriptionDetails(): Promise<any> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/subscription/details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch subscription details');
    return res.json();
  },
  
  async getInvoices(): Promise<any> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/subscription/invoices`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },
  
  async createPortalSession(): Promise<{ url: string }> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/subscription/create-portal`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Failed to create portal session');
    return res.json();
  }
};
```

---

## 📋 **Summary of New Features:**

✅ **Billing Period Display** (Monthly/Yearly)  
✅ **Next Billing Date**  
✅ **Current Price**  
✅ **Payment Method** (Last 4 digits)  
✅ **Trial Information**  
✅ **Usage Statistics** (Contacts, Exports)  
✅ **Billing History** (Past invoices with download)  
✅ **Stripe Portal Integration** (Manage billing, update card, cancel)  

---

## 🎯 **Priority Implementation Order:**

### **Phase 1 (Immediate):**
1. Add `/api/subscription/details` endpoint
2. Add `/api/subscription/create-portal` endpoint
3. Update Account page to show billing period and next date
4. Add "Manage Billing" button → Stripe Portal

### **Phase 2 (Next):**
1. Add `BillingInfo` component
2. Add `UsageStats` component
3. Add `/api/subscription/invoices` endpoint
4. Add `BillingHistory` component

---

Would you like me to implement Phase 1 now? I can:
1. Add the backend endpoints
2. Update the Account page
3. Add the Stripe Portal button

This will give users immediate visibility into their billing! 🚀
