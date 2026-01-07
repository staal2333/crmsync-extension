import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Success } from './pages/Success';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Account } from './pages/Account';
import { StaticPage } from './pages/StaticPages';
import { ConnectCRM } from './pages/ConnectCRM';
import { Exclusions } from './pages/Exclusions';
import { Install } from './pages/Install';
import { Done } from './pages/Done';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  // Simple hash-based router for demo purposes
  const [page, setPage] = useState('home');

  useEffect(() => {
    const handleHashChange = () => {
      let hash = window.location.hash.replace('#/', '');
      
      // Strip query parameters from hash (e.g., login?source=extension -> login)
      const queryIndex = hash.indexOf('?');
      if (queryIndex !== -1) {
        hash = hash.substring(0, queryIndex);
      }
      
      if (!hash) {
        setPage('home');
      } else {
        setPage(hash);
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (newPage: string) => {
    window.location.hash = `/${newPage}`;
  };

  const renderPage = () => {
    // Handle integration pages
    if (page.startsWith('integrations/')) {
      const platform = page.split('/')[1];
      return <StaticPage pageKey={`integration-${platform}`} />;
    }

    // Handle comparison pages
    if (page.startsWith('vs/')) {
      const competitor = page.split('/')[1];
      return <StaticPage pageKey={`vs-${competitor}`} />;
    }

    switch (page) {
      case 'pricing':
        return <Pricing />;
      case 'success':
        return <Success />;
      case 'login':
        return <Login onNavigate={navigate} />;
      case 'register':
        return <Register onNavigate={navigate} />;
      case 'account':
        return <Account onNavigate={navigate} />;
      case 'connect-crm':
        return <ConnectCRM />;
      case 'exclusions':
        return <Exclusions />;
      case 'install':
        return <Install />;
      case 'done':
        return <Done />;
      case 'docs':
      case 'blog':
      case 'about':
      case 'careers':
      case 'privacy':
      case 'terms':
      case 'security':
        return <StaticPage pageKey={page} />;
      case 'home':
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  return (
    <AuthProvider>
      <Layout activePage={page} onNavigate={navigate}>
        {renderPage()}
      </Layout>
    </AuthProvider>
  );
};

export default App;