@@ .. @@
 import { useState } from 'react';
 import { useAuth } from '../../contexts/AuthContext';
+import { useNotifications } from '../../contexts/NotificationContext';
 import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../ui/Card';
@@ .. @@
 
 const Settings = () => {
   const { user } = useAuth();
 }
+  const { notificationsEnabled, toggleNotifications } = useNotifications();
   const [message, setMessage] = useState('');
@@ .. @@
               <div className="flex items-center justify-between">
                 <div>
                   <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push Notificaties</h4>
-                  <p className="text-sm text-gray-500">Ontvang meldingen op je apparaat</p>
+                  <p className="text-sm text-gray-500">Ontvang meldingen over taken en werkbonnen</p>
                <Button
                  variant={notificationsEnabled ? "primary" : "outline"}
                  size="sm"
                  onClick={async () => {
                    try {
                      await toggleNotifications(!notificationsEnabled);
                    } catch (error) {
                      console.error('Error toggling notifications:', error);
                    }
                  }}
                >
                  {notificationsEnabled ? "Ingeschakeld" : "Inschakelen"}
                </Button>
                   <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                 </label>
               </div>

export default message