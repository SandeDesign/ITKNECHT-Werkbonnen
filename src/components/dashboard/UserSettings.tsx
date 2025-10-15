import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseNotifications } from '../../contexts/SupabaseNotificationContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../ui/Card';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { BellRing, Mail, Lock, Camera, X, Download, LogOut } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const nameEmailSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  avatar: z.string().optional(),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  department: z.string().optional(),
  expertise: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type NameEmailFormValues = z.infer<typeof nameEmailSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const UserSettings = () => {
  const { user, updateUser, logout } = useAuth();
  const { preferences, updatePreferences, requestBrowserPermission, browserPermissionStatus } = useSupabaseNotifications();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, control } = useForm<NameEmailFormValues>({
    resolver: zodResolver(nameEmailSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      bio: user?.bio || '',
      department: user?.department || '',
      expertise: user?.expertise?.join(', ') || '',
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handleProfileUpdate = async (data: NameEmailFormValues) => {
    setIsLoading(true);
    setMessage('');
    try {
      const expertiseArray = data.expertise
        ? data.expertise.split(',').map(item => item.trim()).filter(Boolean)
        : [];
      // Only include fields that have values
      const updateData: Partial<User> = {};

      // Add required fields
      updateData.name = data.name;
      updateData.email = data.email;

      // Add optional fields only if they have values
      if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
      if (data.bio) updateData.bio = data.bio;
      if (data.department) updateData.department = data.department;
      if (expertiseArray.length > 0) updateData.expertise = expertiseArray;

      await updateUser(updateData);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    } 
  };

  const handlePasswordUpdate = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    setMessage('');
    try {
      await updateUser({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setMessage('Password updated successfully');
      resetPassword();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleTogglePushNotifications = async () => {
    if (!user?.id) return;

    setIsNotificationLoading(true);
    try {
      if (preferences?.push_notifications_enabled) {
        const success = await updatePreferences({ push_notifications_enabled: false });
        if (success) {
          setMessage('Push notificaties uitgeschakeld');
        }
      } else {
        const granted = await requestBrowserPermission();
        if (granted) {
          setMessage('Push notificaties ingeschakeld');
        } else {
          setMessage('Browser permissie geweigerd');
        }
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      setMessage('Fout bij het wijzigen van notificatie-instellingen');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const handleToggleNotificationType = async (type: keyof typeof preferences, value: boolean) => {
    if (!user?.id) return;

    setIsNotificationLoading(true);
    try {
      const success = await updatePreferences({ [type]: value });
      if (success) {
        setMessage('Notificatie voorkeuren bijgewerkt');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating notification preference:', error);
      setMessage('Fout bij het bijwerken van voorkeuren');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const handleQuietHoursChange = async (start: string | null, end: string | null) => {
    if (!user?.id) return;

    setIsNotificationLoading(true);
    try {
      const success = await updatePreferences({
        quiet_hours_start: start,
        quiet_hours_end: end
      });
      if (success) {
        setMessage('Stille uren bijgewerkt');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      setMessage('Fout bij het bijwerken van stille uren');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const expertiseValue = useWatch({ control, name: 'expertise' }) || '';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Profiel Instellingen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-600 dark:text-gray-400">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-4">
                  <Input
                    label="Naam"
                    error={profileErrors.name?.message}
                    {...registerProfile('name')}
                    placeholder="Jouw naam"
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    error={profileErrors.email?.message}
                    {...registerProfile('email')}
                    placeholder="jouw.email@voorbeeld.nl"
                  />
                  
                  <Input
                    label="Telefoonnummer"
                    type="tel"
                    error={profileErrors.phoneNumber?.message}
                    {...registerProfile('phoneNumber')}
                    placeholder="+31 6 12345678"
                  />

                  <Input
                    label="Afdeling"
                    error={profileErrors.department?.message}
                    {...registerProfile('department')}
                    placeholder="IT Support"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Over mij
                    </label>
                    <textarea
                      {...registerProfile('bio')}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      rows={4}
                      placeholder="Vertel iets over jezelf..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expertise (komma-gescheiden)
                    </label>
                    <input
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      {...registerProfile('expertise')}
                      placeholder="Netwerk, Beveiliging, Cloud"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={isLoading}>
                      Wijzigingen Opslaan
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Wachtwoord Wijzigen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(handlePasswordUpdate)} className="space-y-4">
                  <Input
                    label="Huidig Wachtwoord"
                    type="password"
                    error={passwordErrors.currentPassword?.message}
                    {...registerPassword('currentPassword')}
                    placeholder="Voer je huidige wachtwoord in"
                  />
                  
                  <Input
                    label="Nieuw Wachtwoord"
                    type="password"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword')}
                    placeholder="Voer nieuw wachtwoord in"
                  />
                  
                  <Input
                    label="Bevestig Nieuw Wachtwoord"
                    type="password"
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword('confirmPassword')}
                    placeholder="Bevestig nieuw wachtwoord"
                  />
                  
                  <Button type="submit" isLoading={isPasswordLoading}>
                    Wachtwoord Bijwerken
                  </Button>
                </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <BellRing className={`h-5 w-5 text-amber-500`} />
              <span>Notificatie Instellingen</span>
            </CardTitle>
            <CardDescription>Beheer welke notificaties je wilt ontvangen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push Notificaties</h4>
                    <p className="text-sm text-gray-500">Ontvang browser meldingen op desktop en mobiel</p>
                    {browserPermissionStatus === 'denied' && (
                      <p className="text-xs text-error-600 mt-1">
                        Browser permissie geweigerd. Check je browser instellingen.
                      </p>
                    )}
                    {browserPermissionStatus === 'unsupported' && (
                      <p className="text-xs text-error-600 mt-1">
                        Je browser ondersteunt geen notificaties
                      </p>
                    )}
                  </div>
                  <Button
                    variant={preferences?.push_notifications_enabled ? "primary" : "outline"}
                    size="sm"
                    onClick={handleTogglePushNotifications}
                    isLoading={isNotificationLoading}
                    disabled={browserPermissionStatus === 'unsupported'}
                  >
                    {preferences?.push_notifications_enabled ? "Ingeschakeld" : "Inschakelen"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Notificatie Types</h4>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Nieuwe Taken</p>
                    <p className="text-xs text-gray-500">Melding wanneer een taak aan je wordt toegewezen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.task_assigned_enabled ?? true}
                      onChange={(e) => handleToggleNotificationType('task_assigned_enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Voltooide Taken</p>
                    <p className="text-xs text-gray-500">Melding wanneer een taak is voltooid (alleen admins)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.task_completed_enabled ?? true}
                      onChange={(e) => handleToggleNotificationType('task_completed_enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Werkbon Updates</p>
                    <p className="text-xs text-gray-500">Melding bij werkbon statuswijzigingen</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.workorder_status_enabled ?? true}
                      onChange={(e) => handleToggleNotificationType('workorder_status_enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Feedback Ontvangen</p>
                    <p className="text-xs text-gray-500">Melding wanneer feedback op je taak wordt geplaatst</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.feedback_enabled ?? true}
                      onChange={(e) => handleToggleNotificationType('feedback_enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Systeem Aankondigingen</p>
                    <p className="text-xs text-gray-500">Belangrijke mededelingen van de beheerder</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.system_announcements_enabled ?? true}
                      onChange={(e) => handleToggleNotificationType('system_announcements_enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Notificatie Geluid</p>
                    <p className="text-xs text-gray-500">Speel geluid af bij nieuwe notificaties</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences?.notification_sound_enabled ?? true}
                      onChange={(e) => handleToggleNotificationType('notification_sound_enabled', e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Stille Uren</h4>
                <p className="text-xs text-gray-500 mb-3">Geen notificaties tijdens deze uren</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start tijd
                    </label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_start || ''}
                      onChange={(e) => handleQuietHoursChange(e.target.value || null, preferences?.quiet_hours_end || null)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      disabled={isNotificationLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Eind tijd
                    </label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_end || ''}
                      onChange={(e) => handleQuietHoursChange(preferences?.quiet_hours_start || null, e.target.value || null)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      disabled={isNotificationLoading}
                    />
                  </div>
                </div>
                {preferences?.quiet_hours_start && preferences?.quiet_hours_end && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuietHoursChange(null, null)}
                  >
                    Stille uren verwijderen
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Download className={`h-5 w-5 text-purple-500`} />
              <span>App Installatie</span>
            </CardTitle>
            <CardDescription>Leer hoe je IT Knecht als app kunt installeren</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.open('/install-guide', '_blank')}
              icon={<Download className="h-4 w-4" />}
            >
              Bekijk Installatie Handleiding
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-success-500 text-white p-4 rounded-lg shadow-lg"
        >
          {message}
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <Card>
          <CardContent className="py-6">
            <Button 
              variant="outline" 
              size="lg"
              isFullWidth
              onClick={() => logout()}
              icon={<LogOut className="h-5 w-5" />}
              className="text-error-600 hover:text-error-700 dark:text-error-400"
            >
              Uitloggen
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserSettings;