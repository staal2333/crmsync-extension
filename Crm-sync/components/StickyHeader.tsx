import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, LogIn } from 'lucide-react';
import { LogoIcon } from './Shared';

interface StickyHeaderProps {
  onNavigate?: (page: string) => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky header after scrolling past hero (approximately 600px)
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCTAClick = () => {
    window.open('https://chrome.google.com/webstore', '_blank');
  };

  const handleSignInClick = () => {
    if (onNavigate) {
      onNavigate('login');
    } else {
      window.location.hash = '/login';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-lg"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              {/* Logo */}
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <LogoIcon className="h-8 w-8" />
                <span className="font-bold text-xl text-dark hidden sm:inline">CRMSYNC</span>
              </div>

              {/* CTAs */}
              <div className="flex items-center space-x-3">
                {/* Sign In - Ghost Button */}
                <button
                  onClick={handleSignInClick}
                  className="hidden sm:inline-flex items-center px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all duration-200"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </button>

                {/* Primary CTA - Solid Button */}
                <button
                  onClick={handleCTAClick}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add to Chrome — It's Free</span>
                  <span className="sm:hidden">Get Started</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
