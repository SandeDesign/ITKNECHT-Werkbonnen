import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationService } from '../../services/NotificationService';
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
  const { notificationsEnabled, toggleNotifications } = useNotifications();
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

  const handleToggleNotifications = async () => {
    if (!user?.id) return;
    
    setIsNotificationLoading(true);
    try {
      const success = await toggleNotifications(!notificationsEnabled);
      if (success) {
        setMessage(notificationsEnabled ? 'Notificaties uitgeschakeld' : 'Notificaties ingeschakeld');
      } else {
        setMessage('Fout bij het wijzigen van notificatie-instellingen');
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      setMessage('Fout bij het wijzigen van notificatie-instellingen');
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email Notificaties</h4>
                  <p className="text-sm text-gray-500">Ontvang updates over je account via email</p>
                </div>
                <Button
                  variant={notificationsEnabled ? "primary" : "outline"}
                  size="sm"
                  onClick={handleToggleNotifications}
                  isLoading={isNotificationLoading}
                >
                  {notificationsEnabled ? "Ingeschakeld" : "Inschakelen"}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push Notificaties</h4>
                  <p className="text-sm text-gray-500">Ontvang meldingen over taken en werkbonnen</p>
                </div>
                <Button
                  variant={notificationsEnabled ? "primary" : "outline"}
                  size="sm"
                  onClick={handleToggleNotifications}
                  isLoading={isNotificationLoading}
                  disabled={!NotificationService.isNotificationSupported()}
                >
                  {notificationsEnabled ? "Ingeschakeld" : "Inschakelen"}
                </Button>
                {!NotificationService.isNotificationSupported() && (
                  <p className="text-xs text-error-600 mt-1">
                    Je browser ondersteunt geen notificaties
                  </p>
                )}
              </div>
              
              {notificationsEnabled && (
                <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <p className="text-sm text-primary-700 dark:text-primary-300">
                    Notificaties zijn ingeschakeld. Je ontvangt meldingen over nieuwe taken en updates.
                  </p>
                </div>
              )}
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