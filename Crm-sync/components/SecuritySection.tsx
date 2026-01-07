import React from 'react';
import { Shield, Lock, Eye, Server, FileCheck, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const SecuritySection: React.FC = () => {
  const features = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All data encrypted in transit (TLS 1.3) and at rest (AES-256)'
    },
    {
      icon: Eye,
      title: 'Privacy First',
      description: 'We only detect contacts, never read email content or store messages'
    },
    {
      icon: Server,
      title: 'Secure Cloud Storage',
      description: 'Enterprise-grade infrastructure with automatic backups'
    },
    {
      icon: FileCheck,
      title: 'GDPR Compliant',
      description: 'Full compliance with EU data protection regulations'
    },
    {
      icon: Shield,
      title: 'Zero Data Sharing',
      description: 'Your contacts are never sold, shared, or used for advertising'
    },
    {
      icon: Globe,
      title: 'SOC 2 Ready',
      description: 'Following industry best practices for security and compliance'
    }
  ];

  return (
    <section className="py-24 bg-dark text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Security is Our Priority
          </h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            We understand that you're trusting us with sensitive business relationships. 
            That's why security and privacy are built into everything we do.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">Trusted by professionals at companies like:</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            {/* Placeholder for company logos */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-32 h-12 bg-white/10 rounded-lg flex items-center justify-center text-sm text-gray-500">
                Logo {i}
              </div>
            ))}
          </div>
          <div className="mt-8">
            <a
              href="#/privacy"
              className="inline-flex items-center text-primary hover:text-primary-dark transition-colors font-semibold"
            >
              Read our full Privacy Policy
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </motion.div>

        {/* Security Center CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-16 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm p-10 rounded-3xl border border-white/20 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Questions about security?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            We're happy to discuss our security practices in detail. Contact our team for a security briefing.
          </p>
          <button className="bg-white text-dark px-8 py-3 rounded-xl font-semibold hover:shadow-xl transition-all duration-300">
            Contact Security Team
          </button>
        </motion.div>
      </div>
    </section>
  );
};
