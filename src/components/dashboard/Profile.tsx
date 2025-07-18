import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { StatisticsService } from '../../services/StatisticsService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { User, Mail, Lock, Camera, X } from 'lucide-react';
import { motion } from 'framer-motion';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user?.id) return;
      
      try {
        const userStats = await StatisticsService.getUserOverallStats(user.id);
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching user statistics:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchUserStats();
  }, [user]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    }
  });

  const handleProfileUpdate = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      await updateUser(data);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate an API call
    setTimeout(() => {
      setMessage('Password updated successfully');
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="absolute top-0 right-0"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl text-gray-600 dark:text-gray-400">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full hover:bg-primary-700 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex-1">
                {isEditing ? (
                  <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-4">
                    <Input
                      label="Name"
                      icon={<User size={18} />}
                      error={errors.name?.message}
                      {...register('name')}
                      placeholder="Your name"
                    />
                    
                    <Input
                      label="Email"
                      type="email"
                      icon={<Mail size={18} />}
                      error={errors.email?.message}
                      {...register('email')}
                      placeholder="your.email@example.com"
                    />
                    
                    <div className="flex gap-2">
                      <Button type="submit" isLoading={isLoading}>
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          reset();
                        }}
                        icon={<X size={18} />}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <p className="mt-1 text-gray-900 dark:text-white">{user?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <p className="mt-1 text-gray-900 dark:text-white">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                      <p className="mt-1 text-gray-900 dark:text-white capitalize">{user?.role}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Statistieken</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {isLoadingStats ? (
                          <div className="col-span-2 flex items-center justify-center h-20">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                          </div>
                        ) : stats ? (
                          <>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-500">Totaal Gewerkt</p>
                              <p className="text-lg font-semibold">{stats.totalHoursWorked.toFixed(1)} uur</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-500">Werkbonnen</p>
                              <p className="text-lg font-semibold">{stats.totalWorkOrdersCompleted}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm text-gray-500">Kilometers</p>
                              <p className="text-lg font-semibold">{stats.totalKilometersDriven.toFixed(0)} km</p>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 text-center py-4 text-gray-500 dark:text-gray-400">
                            <p>Geen statistieken beschikbaar</p>
                          </div>
                        )}
                      </div>
                      {stats?.lastWorkOrderDate && (
                        <p className="text-sm text-gray-500">
                          Laatste werkbon: {new Date(stats.lastWorkOrderDate).toLocaleDateString('nl-NL')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                icon={<Lock size={18} />}
                placeholder="Enter your current password"
              />
              
              <Input
                label="New Password"
                type="password"
                icon={<Lock size={18} />}
                placeholder="Enter new password"
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                icon={<Lock size={18} />}
                placeholder="Confirm new password"
              />
              
              <Button type="submit" isLoading={isLoading}>
                Update Password
              </Button>
            </form>
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
    </div>
  );
};

export default Profile;