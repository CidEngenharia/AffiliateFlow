import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { HelmetProvider } from 'react-helmet-async';
import { SpeedInsights } from "@vercel/speed-insights/react";
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Links from './pages/Links';
import Login from './pages/Login';
import AIWriter from './pages/AIWriter';
import BuscaTurbo from './pages/BuscaTurbo';
import Showcase from './pages/Showcase';
import Inspector from './pages/Inspector';

// Carregando outros componentes (Placeholders para agora)
import Campaigns from './pages/Campaigns';

import Analytics from './pages/Analytics';
import Redirector from './pages/Redirector';
import Landing from './pages/Landing';
import Settings from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Para desenvolvimento: Se não houver URL do Supabase, permitimos acesso.
  // Em produção, isso redirecionaria para /login se !user.
  const hasEnv = import.meta.env.VITE_SUPABASE_URL;
  if (hasEnv && !user) return <Navigate to="/login" />;
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HelmetProvider>
        <AuthProvider>
          <SpeedInsights />
          <Router>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/links" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Links />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/campaigns" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Campaigns />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/analytics" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Analytics />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/ai-writer" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIWriter />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/busca-turbo" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <BuscaTurbo />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/inspector" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Inspector />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Public Redirector Route */}
            <Route path="/go/:code" element={<Redirector />} />
            
            {/* Public Showcase Route */}
            <Route path="/v/:username" element={<Showcase />} />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  </ThemeProvider>
  );
};

export default App;
