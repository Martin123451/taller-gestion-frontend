import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import AuthLogin from './app/auth/AuthLogin';
import Layout from './components/Layout';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { currentUser, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Cargando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthLogin />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen bg-background">
          <AppContent />
          <Toaster />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}