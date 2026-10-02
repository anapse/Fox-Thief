import React, { useState, useEffect } from 'react';
import { isAdminAuthenticated } from '../../utils/adminService';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

interface AdminPortalProps {
  onBackToGame: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToGame }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    isAdminAuthenticated()
  );

  useEffect(() => {
    setIsAuthenticated(isAdminAuthenticated());
  }, []);

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToGame={onBackToGame}
      />
    );
  }

  return (
    <AdminDashboard
      onLogout={() => setIsAuthenticated(false)}
      onBackToGame={onBackToGame}
    />
  );
};
