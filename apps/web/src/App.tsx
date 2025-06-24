import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import './index.css';

// PrivateRoute component to protect routes
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/"
            element={
              // <HomePage />
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
              // For a public URL shortener, HomePage can be public.
              // Uncomment PrivateRoute if you want to enforce login for shortening.
              // However, 'My URLs' section already depends on isAuthenticated.
            }
          />
          {/* Catch-all for any other routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
