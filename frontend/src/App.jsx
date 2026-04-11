import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Pages
import WardWatchLandingPage from './pages/WardWatchLandingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import WardWatchDashboard from './pages/Dashboard.jsx';
import WardDetailsPage from './pages/LiveBed.jsx';
import QueueManagement from './pages/Queue.jsx';
import HandoverReports from './pages/HandoverReports.jsx';
import GlobalReports from './pages/GlobalReports.jsx';

import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<WardWatchLandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Pages */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <WardWatchDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ward/:wardId" 
        element={
          <ProtectedRoute>
            <WardDetailsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ward/:wardId/queue" 
        element={
          <ProtectedRoute>
            <QueueManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ward/:wardId/reports"
        element={<Navigate to="/reports" replace />}
      />
      <Route 
        path="/reports"
        element={
          <ProtectedRoute>
            <GlobalReports />
          </ProtectedRoute>
        }
      />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
