import React, { useState } from 'react';
import { Check, Info, X, Loader2 } from 'lucide-react';
import { PRICING_TIERS, FAQS } from '../constants';
import { createCheckoutSession } from '../services/stripeService';
import { Button, SectionHeader, Badge, FadeInUp, StaggerContainer } from '../components/Shared';
import { BillingPeriod } from '../types';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Pricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubscribe = async (tierId: string) => {
    if (tierId === 'free' || tierId === 'enterprise') {
       window.open('https://chrome.google.com/webstore', '_blank');
       return;
    }

    if (!user) {
      // Redirect to login if user tries to buy but isn't logged in
      if (confirm("You need to sign in to purchase a subscription. Go to login?")) {
        window.location.hash = '/login';
      }
      return;
    }

    // Find the tier and get the correct price ID
    const tier = PRICING_TIERS.find(t => t.id === tierId);
    if (!tier) {
      alert('Invalid subscription plan');
      return;
    }

    const priceId = billingPeriod === 'yearly' ? tier.stripePriceYearly : tier.stripePriceMonthly;
    if (!priceId) {
      alert('Price not configured for this plan');
      return;
    }

    setLoadingTier(tierId);
    try {
      // Pass the tier ID to the backend
      const result = await createCheckoutSession(priceId, tierId);
      
      if (result?.url) {
        window.location.href = result.url;
      } else if (result?.error) {
        alert("Payment Error: " + result.error);
      }
      
    } catch (error) {
      console.error(error);
      if ((error as Error).message === "Unauthorized") {
         alert("Your session has expired. Please log in again.");
         window.location.hash = '/login';
      } else {
         alert('Something went wrong initiating the checkout. Please try again.');
      }
    } finally {
      if (loadingTier === tierId) {
         setLoadingTier(null);
      }
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="pt-20 pb-16 bg-gray-50 overflow-hidden relative">
         {/* Background Orbs */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
         </div>

        <FadeInUp className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge>Transparent Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-dark">
            Simple pricing for <span className="gradient-text">everyone</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Choose the plan that fits your needs. Scale up or down at any time.
          </p>

          {/* Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-12 select-none">
            <span 
              className={`text-sm font-medium cursor-pointer transition-colors ${billingPeriod === 'monthly' ? 'text-dark font-bold' : 'text-gray-500'}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${billingPeriod === 'yearly' ? 'bg-primary' : 'bg-gray-300'}`}
              aria-pressed={billingPeriod === 'yearly'}
            >
              <span className="sr-only">Use setting</span>
              <span
                className={`${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                } pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
            <span 
              className={`text-sm font-medium cursor-pointer transition-colors ${billingPeriod === 'yearly' ? 'text-dark font-bold' : 'text-gray-500'}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly <span className="text-accent text-xs ml-1 font-bold bg-accent/10 px-2 py-0.5 rounded-full">SAVE 17%</span>
            </span>
          </div>
        </FadeInUp>
      </section>

      {/* Cards */}
      <section className="py-16 -mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PRICING_TIERS.map((tier) => (
              <motion.div 
                key={tier.id}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 }
                }}
                className={`relative bg-white rounded-2xl p-8 flex flex-col ${
                  tier.isPopular ? 'ring-2 ring-primary shadow-2xl scale-105 z-10' : 'border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300'
                }`}
              >
                {tier.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-md">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-dark mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-500 mb-6 min-h-[40px]">{tier.description}</p>
                
                <div className="mb-6">
                  {tier.id === 'enterprise' ? (
                     <span className="text-3xl font-bold">Custom</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-dark">
                        ${billingPeriod === 'yearly' ? Math.round(tier.priceYearly / 12) : tier.priceMonthly}
                      </span>
                      <span className="text-gray-500 text-sm">/mo</span>
                      {billingPeriod === 'yearly' && (
                        <p className="text-xs text-gray-400 mt-1">Billed ${tier.priceYearly} yearly</p>
                      )}
                    </>
                  )}
                </div>

                <Button 
                  variant={tier.variant} 
                  className="w-full mb-8"
                  onClick={() => handleSubscribe(tier.id)}
                  isLoading={loadingTier === tier.id}
                  disabled={loadingTier !== null && loadingTier !== tier.id}
                >
                  {tier.buttonText}
                </Button>

                <ul className="space-y-3 flex-grow">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <Check className="h-4 w-4 text-accent mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Detailed Comparison" subtitle="Compare features across all plans to find the right fit for your business." />
          
          <FadeInUp className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-4 border-b-2 border-gray-100 min-w-[200px] bg-gray-50">Features</th>
                  {PRICING_TIERS.map(tier => (
                    <th key={tier.id} className="p-4 border-b-2 border-gray-100 font-semibold text-dark text-center min-w-[140px] bg-gray-50">{tier.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Contact Limit", values: ["50", "Unlimited", "Unlimited", "Unlimited"] },
                  { name: "Cloud Sync", values: [false, true, true, true] },
                  { name: "CSV Export", values: ["1/week", "Unlimited", "Unlimited", "Unlimited"] },
                  { name: "Team Members", values: ["1", "1", "Up to 5", "Unlimited"] },
                  { name: "CRM Integration", values: [false, false, true, true] },
                  { name: "Support", values: ["Community", "Priority Email", "24/7 Priority", "Phone + Dedicated"] },
                ].map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="p-4 text-sm font-medium text-gray-900 border-b border-gray-100">{row.name}</td>
                    {row.values.map((val, idx) => (
                      <td key={idx} className="p-4 text-center text-sm text-gray-600 border-b border-gray-100">
                        {typeof val === 'boolean' ? (
                          val ? <Check className="h-5 w-5 text-accent mx-auto" /> : <X className="h-5 w-5 text-gray-300 mx-auto" />
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </FadeInUp>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader title="Frequently Asked Questions" />
          <StaggerContainer className="space-y-4">
            {FAQS.map((faq, idx) => (
              <motion.div 
                key={idx} 
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:border-primary/20 transition-colors"
              >
                <h4 className="font-semibold text-dark mb-2">{faq.question}</h4>
                <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
};