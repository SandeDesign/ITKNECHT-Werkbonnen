import { useState, useEffect } from 'react';
import { NotificationService } from '../../services/NotificationService';
import { SupabaseNotificationService } from '../../services/SupabaseNotificationService';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, RefreshCw, Trash2, Info } from 'lucide-react';

export default function NotificationDebug() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadDebugInfo = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const info = await NotificationService.getDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, [user]);

  const handleRequestPermission = async () => {
    if (!user) return;
    setLoading(true);
    setTestResult(null);
    try {
      const granted = await NotificationService.requestPermission(user.id);
      setTestResult(granted ? '✅ Permission granted and token registered' : '❌ Permission denied');
      await loadDebugInfo();
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    setLoading(true);
    setTestResult(null);
    try {
      const success = await SupabaseNotificationService.sendFCMPushNotification(
        user.id,
        'SYSTEM_ANNOUNCEMENT',
        '🧪 Test Notification',
        'This is a test notification to verify your setup is working correctly.',
        { test: true },
        '/dashboard'
      );
      setTestResult(success ? '✅ Test notification sent successfully' : '❌ Failed to send test notification');
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearState = async () => {
    if (!confirm('Are you sure you want to clear all notification state? You will need to re-register.')) {
      return;
    }
    NotificationService.clearAllState();
    setTestResult('🧹 State cleared. Please refresh the page and re-enable notifications.');
    await loadDebugInfo();
  };

  const handleRefresh = async () => {
    setTestResult(null);
    await loadDebugInfo();
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">Please log in to view notification debug information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Debug & Test
        </h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {testResult && (
        <div className={`p-4 rounded-lg ${
          testResult.startsWith('✅')
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <p className="font-medium">{testResult}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleRequestPermission}
          disabled={loading}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
        >
          Request Permission
        </button>
        <button
          onClick={handleTestNotification}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          Send Test Notification
        </button>
        <button
          onClick={handleClearState}
          disabled={loading}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear State
        </button>
      </div>

      {debugInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Info className="h-5 w-5" />
              Debug Information
            </h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notification Permission</dt>
                <dd className={`mt-1 text-sm font-semibold ${
                  debugInfo.notificationPermission === 'granted'
                    ? 'text-green-600 dark:text-green-400'
                    : debugInfo.notificationPermission === 'denied'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {debugInfo.notificationPermission}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Service Worker</dt>
                <dd className={`mt-1 text-sm font-semibold ${
                  debugInfo.serviceWorkerRegistrations > 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {debugInfo.serviceWorkerRegistrations > 0 ? `✅ ${debugInfo.serviceWorkerRegistrations} registered` : '❌ Not registered'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">FCM Token</dt>
                <dd className={`mt-1 text-sm font-semibold ${
                  debugInfo.storedToken === 'present'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {debugInfo.storedToken === 'present' ? '✅ Token registered' : '❌ No token'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Circuit Breaker</dt>
                <dd className={`mt-1 text-sm font-semibold ${
                  debugInfo.circuitBreakerActive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {debugInfo.circuitBreakerActive
                    ? `⏳ Active (${debugInfo.circuitBreakerSecondsRemaining}s remaining)`
                    : '✅ Inactive'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Device Type</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {debugInfo.deviceInfo?.type} - {debugInfo.deviceInfo?.name}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PWA Installed</dt>
                <dd className={`mt-1 text-sm font-semibold ${
                  debugInfo.deviceInfo?.isPWA
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {debugInfo.deviceInfo?.isPWA ? '✅ Yes' : '⚠️ No'}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Retry Count</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {debugInfo.retryCount}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Registration</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {debugInfo.lastRegistration === 'never'
                    ? 'Never'
                    : new Date(parseInt(debugInfo.lastRegistration)).toLocaleString()}
                </dd>
              </div>
            </dl>

            {debugInfo.serviceWorkerStates && debugInfo.serviceWorkerStates.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Service Worker States</h4>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {JSON.stringify(debugInfo.serviceWorkerStates, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 Troubleshooting Tips</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Make sure you're using HTTPS or localhost</li>
          <li>Check browser console for detailed error messages</li>
          <li>Try clearing the state and re-requesting permission</li>
          <li>If circuit breaker is active, wait for it to reset</li>
          <li>Check that service worker is registered successfully</li>
          <li>Ensure FCM credentials are properly configured</li>
        </ul>
      </div>
    </div>
  );
}
