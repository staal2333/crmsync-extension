import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Download, Clock } from 'lucide-react';

export const CompanyLogos: React.FC = () => {
  // Features to highlight for a new product launch
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Extract contacts in seconds'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data stays secure'
    },
    {
      icon: Download,
      title: 'CSV Export',
      description: 'Ready for any CRM'
    },
    {
      icon: Clock,
      title: '2-Min Setup',
      description: 'No learning curve'
    }
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
            What makes CRM-Sync different
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-bold text-dark mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Chrome Web Store Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <div className="inline-flex items-center px-6 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#4285F4"/>
                <circle cx="12" cy="12" r="6" fill="#FBBC05"/>
                <circle cx="12" cy="12" r="3" fill="#34A853"/>
              </svg>
              <div className="text-left">
                <div className="text-xs text-gray-500">Available on</div>
                <div className="text-sm font-semibold text-dark">Chrome Web Store</div>
              </div>
            </div>
          </motion.div>

          {/* Early Access Message */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="mt-8"
          >
            <p className="text-sm text-gray-500">
              🚀 <span className="font-semibold text-dark">Early access available now</span> — Join us in building the future of contact management
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
