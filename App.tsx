import React from 'react';
import { AppProvider, useAuth } from './contexts/AppContext';
import AuthLogin from './app/auth/AuthLogin';
import Layout from './components/Layout';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthLogin />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        <AppContent />
        <Toaster />
      </div>
    </AppProvider>
  );
}