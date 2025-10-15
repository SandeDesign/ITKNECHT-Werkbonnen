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
  window.addEventListener('load', async () => {
    try {
      // First, unregister any existing service workers to ensure clean state
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Unregistered existing service worker');
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Register the main service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('✅ Service Worker registered successfully:', registration.scope);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker is ready');

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
          const notificationId = event.data.notificationId;

          if (notificationId) {
            try {
              const { SupabaseNotificationService } = await import('./services/SupabaseNotificationService');
              await SupabaseNotificationService.markAsClicked(notificationId);
              console.log('✅ Notification marked as clicked:', notificationId);
            } catch (error) {
              console.error('❌ Error marking notification as clicked:', error);
            }
          }
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Check every hour

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  });
}