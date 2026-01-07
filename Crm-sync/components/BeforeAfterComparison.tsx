import React from 'react';
import { X, Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const BeforeAfterComparison: React.FC = () => {
  const comparisons = [
    {
      aspect: 'Contact Detection',
      manual: 'Manually copy-paste from signatures',
      crmsync: 'AI automatically detects contacts',
    },
    {
      aspect: 'Accuracy',
      manual: 'Typos and copy-paste errors common',
      crmsync: '99.9% accuracy with AI validation',
    },
    {
      aspect: 'Time per Contact',
      manual: '2-3 minutes of manual work',
      crmsync: '2 seconds - fully automated',
    },
    {
      aspect: 'Email Updates',
      manual: 'Miss changes and updates',
      crmsync: 'Real-time detection on every email',
    },
    {
      aspect: 'Company Info',
      manual: 'Manual research required',
      crmsync: 'Auto-enrichment with company data',
    },
    {
      aspect: 'Export Format',
      manual: 'Manual formatting, error-prone',
      crmsync: 'Clean CSV export, CRM-ready',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-dark mb-6">
            Why AI Makes All the Difference
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Standard scrapers just extract text. Our AI understands context, validates data, and enriches contacts automatically.
          </p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-xl"
        >
          {/* Table Header */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-white border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide"></div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 bg-red-50 border border-red-100 rounded-xl">
                <X className="h-4 w-4 text-red-500 mr-2" />
                <span className="font-bold text-dark">Manual Entry</span>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg">
                <Check className="h-4 w-4 mr-2" />
                <span className="font-bold">CRM-Sync AI</span>
              </div>
            </div>
          </div>

          {/* Table Rows */}
          {comparisons.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`grid grid-cols-3 gap-4 p-6 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } hover:bg-blue-50/30 transition-colors`}
            >
              <div className="font-semibold text-dark">{item.aspect}</div>
              <div className="flex items-start space-x-2 text-gray-600">
                <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{item.manual}</span>
              </div>
              <div className="flex items-start space-x-2 text-dark">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{item.crmsync}</span>
              </div>
            </motion.div>
          ))}

          {/* Summary Footer */}
          <div className="bg-gradient-to-r from-primary to-secondary p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-white/90">Time Saved</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">10x</div>
                <div className="text-white/90">Faster Processing</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">99.9%</div>
                <div className="text-white/90">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-gray-600 mb-6">
            Stop wasting time on manual data entry. Let AI do the heavy lifting.
          </p>
          <button
            onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
            className="bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300 inline-flex items-center"
          >
            Try AI-Powered Detection Free
            <Zap className="ml-2 h-5 w-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};
