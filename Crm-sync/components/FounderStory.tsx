import React from 'react';
import { motion } from 'framer-motion';
import { Chrome } from 'lucide-react';

export const FounderStory: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Photo & Badge */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 p-12 bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col items-center justify-center text-center"
            >
              {/* Photo Placeholder - Replace with your actual photo */}
              <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary mb-6 shadow-2xl flex items-center justify-center text-white text-6xl font-bold border-8 border-white">
                S
              </div>
              
              <div className="bg-white px-4 py-2 rounded-full shadow-md border border-gray-100 flex items-center space-x-2">
                <span className="text-2xl">🇩🇰</span>
                <span className="text-sm font-medium text-gray-700">Built in Birkerød, Denmark</span>
              </div>

              {/* Optional: Add social links or credentials */}
              <div className="mt-6 flex space-x-4">
                <div className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                  💼 3+ years in Sales Ops
                </div>
              </div>
            </motion.div>

            {/* Right Column - Story */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3 p-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-dark mb-6">
                Why I Built This
              </h2>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  I spent three years in sales operations watching my team waste <span className="font-semibold text-primary">6+ hours every week</span> copying contact details from Gmail into HubSpot. 
                </p>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  We tried everything—spreadsheets, Zapier, expensive enterprise tools. Nothing actually solved the problem. They were either too complicated, too expensive, or just didn't work with our workflow.
                </p>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  So I built <span className="font-semibold text-dark">CRM-Sync</span> in my apartment in Birkerød: a Chrome extension that does <span className="font-semibold">one thing really well</span>—it watches your Gmail, detects contacts automatically, and syncs them to your CRM in real-time.
                </p>
                
                <p className="text-gray-700 leading-relaxed mb-6">
                  No training. No workflow changes. No $100/month enterprise bloat. Just install it, and it works.
                </p>
                
                <div className="bg-blue-50 border-l-4 border-primary p-6 rounded-r-xl mb-8">
                  <p className="text-gray-800 font-medium italic">
                    "If you're tired of manual data entry eating up your day, this is for you."
                  </p>
                  <p className="text-sm text-gray-600 mt-2">— Sebastian, Founder</p>
                </div>
              </div>

              <button 
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                className="group bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center"
              >
                <Chrome className="mr-3 h-5 w-5" />
                Try It Free — No Credit Card
                <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
