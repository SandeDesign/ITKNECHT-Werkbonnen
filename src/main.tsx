import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ScrollToTop from './components/ui/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SupabaseNotificationProvider } from './contexts/SupabaseNotificationContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <SupabaseNotificationProvider>
            <App />
          </SupabaseNotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('Service Worker registered successfully:', registration);

      // Listen voor berichten van de service worker
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          const notificationId = event.data.notificationId;

          if (notificationId) {
            try {
              const { SupabaseNotificationService } = await import('./services/SupabaseNotificationService');
              await SupabaseNotificationService.markAsClicked(notificationId);
              console.log('Notification marked as clicked:', notificationId);
            } catch (error) {
              console.error('Error marking notification as clicked:', error);
            }
          }
        }
      });
    }).catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  });
}