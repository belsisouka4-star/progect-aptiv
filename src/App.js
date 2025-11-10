import React, { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { App } from '@capacitor/app';

// Pages
import Login from "./pages/Login";
import Search from "./pages/Search";
import PieceDetails from "./pages/PieceDetails";
import ManagePieces from "./pages/ManagePieces";

// Components
import Notification from "./components/Notification";
import ConfirmationDialog from "./components/ConfirmationDialog";
import ErrorBoundary from "./components/ErrorBoundary";

// Services
import dataManager from "./services/DataManager";

// Styles
import './styles/corporate.css';

// Notification Context
const NotificationContext = createContext();

// Confirmation Context
const ConfirmationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

function AppContent() {
  const [notifications, setNotifications] = useState([]);
  const [confirmation, setConfirmation] = useState(null);
  const navigate = useNavigate();

  const showNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showConfirmation = (message) => {
    return new Promise((resolve) => {
      setConfirmation({
        message,
        onConfirm: () => {
          setConfirmation(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmation(null);
          resolve(false);
        }
      });
    });
  };

  useEffect(() => {
    // Delay heavy initialization to after first paint using requestIdleCallback
    const initializeApp = async () => {
      try {
        await dataManager.init?.();

        // Check if we need to migrate data from localStorage (delay this operation)
        setTimeout(async () => {
          try {
            const localStoragePieces = JSON.parse(localStorage.getItem('pieces') || '[]');
            if (localStoragePieces.length > 0) {
              const existingPieces = await dataManager.getAllPieces();
              if (existingPieces.length === 0) {
                await dataManager.bulkAddPieces?.(localStoragePieces);
              }
            }
          } catch (migrationError) {
          }
        }, 100); // Reduced delay to 100ms for faster loading
      } catch (error) {
      }
    };

    // Use requestIdleCallback to delay initialization until after first paint
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initializeApp(), { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(initializeApp, 100);
    }

    // Cleanup when app unmounts
    return () => {
    };
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle back button for mobile
  useEffect(() => {
    const handleBackButton = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        navigate(-1);
      } else {
        // If on login page, exit app
        App.exitApp();
      }
    };

    App.addListener('backButton', handleBackButton);

    return () => {
      App.removeAllListeners();
    };
  }, [navigate]);

  return (
    <ErrorBoundary>
      <NotificationContext.Provider value={{ showNotification }}>
        <ConfirmationContext.Provider value={{ showConfirmation }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/search" element={<Search />} />
            <Route path="/manage-pieces" element={<ManagePieces />} />
            <Route path="/piece/:id" element={<PieceDetails />} />
          </Routes>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
          {confirmation && (
            <ConfirmationDialog
              message={confirmation.message}
              onConfirm={confirmation.onConfirm}
              onCancel={confirmation.onCancel}
            />
          )}
        </ConfirmationContext.Provider>
      </NotificationContext.Provider>
    </ErrorBoundary>
  );
}

function APTIVM2() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default APTIVM2;
