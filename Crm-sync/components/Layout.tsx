import React, { useState, useEffect } from 'react';
import { Menu, X, Github, Twitter, Linkedin, User, LogOut } from 'lucide-react';
import { LogoIcon } from './Shared';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<{ activePage: string; onNavigate: (page: string) => void }> = ({ activePage, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClass = (page: string) => 
    `text-sm font-medium transition-colors hover:text-primary cursor-pointer ${activePage === page ? 'text-primary' : 'text-gray-600'}`;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('home')}>
            <div className="mr-2 transform group-hover:rotate-12 transition-transform duration-300 ease-in-out">
              <LogoIcon className="h-8 w-8" />
            </div>
            <span className="font-bold text-xl text-dark tracking-tight">CRM<span className="text-primary">SYNC</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <span onClick={() => onNavigate('home')} className={navLinkClass('home')}>Features</span>
            <span onClick={() => onNavigate('pricing')} className={navLinkClass('pricing')}>Pricing</span>
            <span onClick={() => onNavigate('docs')} className={navLinkClass('docs')}>Docs</span>
            <span onClick={() => onNavigate('blog')} className={navLinkClass('blog')}>Blog</span>
            
            <div className="flex items-center space-x-4 ml-4">
              {user ? (
                <>
                  <span onClick={() => onNavigate('account')} className="flex items-center text-sm font-medium text-dark hover:text-primary cursor-pointer">
                    <User className="w-4 h-4 mr-1" />
                    Account
                  </span>
                  <button 
                    onClick={() => { logout(); onNavigate('home'); }}
                    className="text-gray-500 hover:text-red-600"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-dark font-medium text-sm">Sign In</button>
                  <button 
                    onClick={() => onNavigate('register')}
                    className="bg-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-dark-lighter transition-colors shadow-lg shadow-dark/20"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600">
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute w-full px-4 pt-2 pb-6 flex flex-col space-y-4 border-t border-gray-100">
          <span onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} className="block py-2 text-base font-medium text-gray-700">Features</span>
          <span onClick={() => { onNavigate('pricing'); setIsMobileMenuOpen(false); }} className="block py-2 text-base font-medium text-gray-700">Pricing</span>
          <span onClick={() => { onNavigate('docs'); setIsMobileMenuOpen(false); }} className="block py-2 text-base font-medium text-gray-700">Docs</span>
          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
             {user ? (
               <>
                 <button onClick={() => { onNavigate('account'); setIsMobileMenuOpen(false); }} className="w-full text-center py-2 text-primary font-medium">My Account</button>
                 <button onClick={() => { logout(); onNavigate('home'); setIsMobileMenuOpen(false); }} className="w-full text-center py-2 text-red-600 font-medium">Sign Out</button>
               </>
             ) : (
               <>
                 <button onClick={() => { onNavigate('login'); setIsMobileMenuOpen(false); }} className="w-full text-center py-2 text-gray-600 font-medium">Sign In</button>
                 <button 
                   onClick={() => { onNavigate('register'); setIsMobileMenuOpen(false); }}
                   className="w-full text-center py-2 bg-primary text-white rounded-lg font-medium"
                 >
                   Get Started
                 </button>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
};

export const Footer: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center mb-4">
              <div className="mr-2">
                <LogoIcon className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl text-dark">CRMSYNC</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Automated contact management for modern professionals.
            </p>
            <div className="flex space-x-4">
              <Twitter className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
              <Github className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-dark mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><span onClick={() => onNavigate('home')} className="hover:text-primary transition-colors cursor-pointer">Features</span></li>
              <li><span onClick={() => onNavigate('pricing')} className="hover:text-primary transition-colors cursor-pointer">Pricing</span></li>
              <li><span onClick={() => onNavigate('blog')} className="hover:text-primary transition-colors cursor-pointer">Blog</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-dark mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><span onClick={() => onNavigate('docs')} className="hover:text-primary transition-colors cursor-pointer">Documentation</span></li>
              <li><span onClick={() => onNavigate('about')} className="hover:text-primary transition-colors cursor-pointer">About</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-dark mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><span onClick={() => onNavigate('careers')} className="hover:text-primary transition-colors cursor-pointer">Careers</span></li>
              <li><span onClick={() => onNavigate('privacy')} className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span onClick={() => onNavigate('terms')} className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">© 2024 CRMSYNC. All rights reserved.</p>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4 md:mt-0">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-dark bg-white">
      <Navbar activePage={activePage} onNavigate={onNavigate} />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
};