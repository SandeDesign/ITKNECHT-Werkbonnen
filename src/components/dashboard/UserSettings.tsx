import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseNotifications } from '../../contexts/SupabaseNotificationContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { 
  BellRing, 
  Lock, 
  Camera, 
  Download, 
  LogOut, 
  User, 
  Check,
  X,
  Upload,
  Loader
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters zijn'),
  email: z.string().email('Voer een geldig e-mailadres in'),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  department: z.string().optional(),
  expertise: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters zijn'),
  newPassword: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters zijn'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const UserSettings = () => {
  const { user, updateUser, logout } = useAuth();
  const { preferences, updatePreferences, requestBrowserPermission, browserPermissionStatus } = useSupabaseNotifications();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
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
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Selecteer een geldig afbeeldingsbestand');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Afbeelding moet kleiner zijn dan 2MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        
        // Update user profile with new avatar
        try {
          await updateUser({ avatar: base64String });
          showMessage('success', 'Profielfoto bijgewerkt');
        } catch (error) {
          showMessage('error', 'Fout bij het uploaden van profielfoto');
          setPreviewImage(null);
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.onerror = () => {
        showMessage('error', 'Fout bij het lezen van afbeelding');
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showMessage('error', 'Fout bij het uploaden van profielfoto');
      setIsUploadingImage(false);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    setIsProfileLoading(true);
    try {
      const expertiseArray = data.expertise
        ? data.expertise.split(',').map(item => item.trim()).filter(Boolean)
        : [];

      const updateData: any = {
        name: data.name,
        email: data.email,
      };

      if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
      if (data.bio) updateData.bio = data.bio;
      if (data.department) updateData.department = data.department;
      if (expertiseArray.length > 0) updateData.expertise = expertiseArray;

      await updateUser(updateData);
      showMessage('success', 'Profiel succesvol bijgewerkt');
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Fout bij het bijwerken van profiel');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    try {
      await updateUser({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      showMessage('success', 'Wachtwoord succesvol gewijzigd');
      resetPassword();
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Fout bij het wijzigen van wachtwoord');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleTogglePushNotifications = async () => {
    if (!user?.id) return;

    setIsNotificationLoading(true);
    try {
      if (preferences?.push_notifications_enabled) {
        await updatePreferences({ push_notifications_enabled: false });
        showMessage('success', 'Push notificaties uitgeschakeld');
      } else {
        const granted = await requestBrowserPermission();
        if (granted) {
          showMessage('success', 'Push notificaties ingeschakeld');
        } else {
          showMessage('error', 'Browser permissie geweigerd');
        }
      }
    } catch (error) {
      showMessage('error', 'Fout bij het wijzigen van notificatie-instellingen');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const handleToggleNotificationType = async (type: keyof typeof preferences, value: boolean) => {
    if (!user?.id) return;

    setIsNotificationLoading(true);
    try {
      await updatePreferences({ [type]: value });
      showMessage('success', 'Notificatie voorkeuren bijgewerkt');
    } catch (error) {
      showMessage('error', 'Fout bij het bijwerken van voorkeuren');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const handleQuietHoursChange = async (start: string | null, end: string | null) => {
    if (!user?.id) return;

    setIsNotificationLoading(true);
    try {
      await updatePreferences({
        quiet_hours_start: start,
        quiet_hours_end: end
      });
      showMessage('success', 'Stille uren bijgewerkt');
    } catch (error) {
      showMessage('error', 'Fout bij het bijwerken van stille uren');
    } finally {
      setIsNotificationLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instellingen</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Beheer je account en voorkeuren</p>
      </div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              Profiel
            </CardTitle>
            <CardDescription>Beheer je persoonlijke informatie</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                    {isUploadingImage ? (
                      <Loader className="h-8 w-8 text-primary-600 animate-spin" />
                    ) : (previewImage || user?.avatar) ? (
                      <img 
                        src={previewImage || user?.avatar} 
                        alt={user?.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Profielfoto</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Upload een vierkante foto voor het beste resultaat. Max 2MB.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    icon={<Upload className="h-4 w-4" />}
                  >
                    Upload Foto
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Over mij
                </label>
                <textarea
                  {...registerProfile('bio')}
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={4}
                  placeholder="Vertel iets over jezelf..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expertise <span className="text-xs text-gray-500">(komma-gescheiden)</span>
                </label>
                <input
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  {...registerProfile('expertise')}
                  placeholder="Netwerk, Beveiliging, Cloud"
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" isLoading={isProfileLoading}>
                  Opslaan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary-600" />
              Beveiliging
            </CardTitle>
            <CardDescription>Wijzig je wachtwoord</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handlePasswordSubmit(handlePasswordUpdate)} className="space-y-4">
              <Input
                label="Huidig Wachtwoord"
                type="password"
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
                placeholder="••••••••"
              />
              
              <Input
                label="Nieuw Wachtwoord"
                type="password"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
                placeholder="••••••••"
              />
              
              <Input
                label="Bevestig Nieuw Wachtwoord"
                type="password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
                placeholder="••••••••"
              />
              
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="submit" isLoading={isPasswordLoading}>
                  Wachtwoord Wijzigen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary-600" />
              Notificaties
            </CardTitle>
            <CardDescription>Beheer welke notificaties je wilt ontvangen</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push Notificaties</h4>
                  <p className="text-sm text-gray-500 mt-1">Ontvang browser meldingen</p>
                  {browserPermissionStatus === 'denied' && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Browser permissie geweigerd
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
                  {preferences?.push_notifications_enabled ? "Aan" : "Uit"}
                </Button>
              </div>

              {/* Notification Types */}
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Notificatie Types</h4>

                {[
                  { key: 'task_assigned_enabled', label: 'Nieuwe Taken', desc: 'Melding wanneer een taak aan je wordt toegewezen' },
                  { key: 'task_completed_enabled', label: 'Voltooide Taken', desc: 'Melding wanneer een taak is voltooid' },
                  { key: 'workorder_status_enabled', label: 'Werkbon Updates', desc: 'Melding bij werkbon statuswijzigingen' },
                  { key: 'feedback_enabled', label: 'Feedback', desc: 'Melding wanneer feedback wordt geplaatst' },
                  { key: 'system_announcements_enabled', label: 'Aankondigingen', desc: 'Belangrijke mededelingen' },
                  { key: 'notification_sound_enabled', label: 'Notificatie Geluid', desc: 'Speel geluid af bij nieuwe notificaties' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-lg cursor-pointer group">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences?.[item.key as keyof typeof preferences] ?? true}
                      onChange={(e) => handleToggleNotificationType(item.key as keyof typeof preferences, e.target.checked)}
                      className="sr-only peer"
                      disabled={isNotificationLoading}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 relative"></div>
                  </label>
                ))}
              </div>

              {/* Quiet Hours */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Stille Uren</h4>
                <p className="text-xs text-gray-500 mb-4">Geen notificaties tijdens deze uren</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start
                    </label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_start || ''}
                      onChange={(e) => handleQuietHoursChange(e.target.value || null, preferences?.quiet_hours_end || null)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={isNotificationLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Eind
                    </label>
                    <input
                      type="time"
                      value={preferences?.quiet_hours_end || ''}
                      onChange={(e) => handleQuietHoursChange(preferences?.quiet_hours_start || null, e.target.value || null)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      disabled={isNotificationLoading}
                    />
                  </div>
                </div>
                {preferences?.quiet_hours_start && preferences?.quiet_hours_end && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuietHoursChange(null, null)}
                    className="mt-3"
                  >
                    Verwijderen
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Installation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary-600" />
              App Installatie
            </CardTitle>
            <CardDescription>Installeer IT Knecht als app op je apparaat</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button
              onClick={() => window.open('/install-guide', '_blank')}
              icon={<Download className="h-4 w-4" />}
            >
              Bekijk Installatie Handleiding
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Uitloggen</h3>
                <p className="text-sm text-gray-500 mt-1">Beëindig je huidige sessie</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => logout()}
                icon={<LogOut className="h-4 w-4" />}
                className="text-red-600 hover:text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                Uitloggen
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Toast Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              message.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {message.type === 'success' ? (
                <Check className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSettings;