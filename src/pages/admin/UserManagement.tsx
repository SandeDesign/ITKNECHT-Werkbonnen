import { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StatisticsService } from '../../services/StatisticsService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { 
  Users, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  TrendingUp,
  Award,
  MapPin,
  Calendar,
  Edit2,
  Shield,
  User
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'monteur';
  phoneNumber?: string;
  bio?: string;
  department?: string;
  expertise?: string[];
  createdAt: string;
  updatedAt?: string;
  stats?: {
    totalHoursWorked: number;
    totalWorkOrdersCompleted: number;
    totalKilometersDriven: number;
    lastWorkOrderDate?: string;
    totalRevenue: number;
  };
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'monteur'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});

  console.log('UserManagement: Component initialized');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError(null);
        console.log('UserManagement: Fetching users from Firestore...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserData[];
        
        // Now fetch statistics for each user
        const usersWithStats = await Promise.all(
          usersData.map(async (user) => {
            try {
              const stats = await StatisticsService.getUserOverallStats(user.id);
              return {
                ...user,
                stats: {
                  totalHoursWorked: stats.totalHoursWorked,
                  totalWorkOrdersCompleted: stats.totalWorkOrdersCompleted,
                  totalKilometersDriven: stats.totalKilometersDriven,
                  lastWorkOrderDate: stats.lastWorkOrderDate,
                  totalRevenue: stats.totalHoursWorked * stats.averageHourlyRate
                }
              };
            } catch (error) {
              console.error(`Error fetching stats for user ${user.id}:`, error);
              return user;
            }
          })
        );
        
        setUsers(usersWithStats);
        setFilteredUsers(usersWithStats);
        console.log('UserManagement: Fetched', usersWithStats.length, 'users with stats');

      } catch (error) {
        console.error('UserManagement: Error fetching users:', error);
        setError('Fout bij laden van gebruikers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower) ||
        user.expertise?.some(exp => exp.toLowerCase().includes(searchLower))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    console.log('UserManagement: Filtered to', filtered.length, 'users');
  }, [users, searchTerm, roleFilter]);

  const handleEditUser = (user: UserData) => {
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
      department: user.department || '',
      expertise: user.expertise || []
    });
    console.log('UserManagement: Editing user:', user.id);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const userRef = doc(db, 'users', editingUser);
      await updateDoc(userRef, {
        ...editForm,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser 
          ? { ...user, ...editForm, updatedAt: new Date().toISOString() }
          : user
      ));

      setEditingUser(null);
      setEditForm({});
      console.log('UserManagement: Updated user:', editingUser);

    } catch (error) {
      console.error('UserManagement: Error updating user:', error);
      alert('Fout bij bijwerken gebruiker');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const calculateUserStats = (user: UserData) => {
    const hoursWorked = user.stats?.totalHoursWorked || 0;
    const ordersCompleted = user.stats?.totalWorkOrdersCompleted || 0;
    const kilometersTotal = user.stats?.totalKilometersDriven || 0;
    const revenue = user.stats?.totalRevenue || 0;

    return {
      hoursWorked,
      ordersCompleted,
      kilometersTotal,
      revenue,
      averageHoursPerOrder: ordersCompleted > 0 ? hoursWorked / ordersCompleted : 0,
      averageKmPerOrder: ordersCompleted > 0 ? kilometersTotal / ordersCompleted : 0
    };
  };

  const getTotalStats = () => {
    return filteredUsers.reduce((totals, user) => {
      const stats = calculateUserStats(user);
      return {
        totalUsers: totals.totalUsers + 1,
        totalHours: totals.totalHours + stats.hoursWorked,
        totalOrders: totals.totalOrders + stats.ordersCompleted,
        totalRevenue: totals.totalRevenue + stats.revenue,
        totalKilometers: totals.totalKilometers + stats.kilometersTotal
      };
    }, {
      totalUsers: 0,
      totalHours: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalKilometers: 0
    });
  };

  const totalStats = getTotalStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <Users className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Fout bij laden</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Totaal Gebruikers</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalUsers}
                </p>
                <p className="text-sm text-gray-500">
                  {users.filter(u => u.role === 'admin').length} admin, {users.filter(u => u.role === 'monteur').length} monteur
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Totaal Uren</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalHours.toFixed(1)}u
                </p>
                <p className="text-sm text-gray-500">gewerkt</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Werkbonnen</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalOrders}
                </p>
                <p className="text-sm text-gray-500">voltooid</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Omzet</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  €{totalStats.totalRevenue.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">ex BTW</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Kilometers</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalStats.totalKilometers.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500">gereden</p>
              </div>
              <MapPin className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <CardTitle>Gebruikers Beheer</CardTitle>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Zoeken..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="all">Alle rollen</option>
                <option value="admin">Admin</option>
                <option value="monteur">Monteur</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Geen gebruikers gevonden</h3>
              <p>Probeer de filters aan te passen.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const stats = calculateUserStats(user);
                const isEditing = editingUser === user.id;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {isEditing ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Naam"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          />
                          <Input
                            label="Telefoon"
                            value={editForm.phoneNumber || ''}
                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Rol
                            </label>
                            <select
                              value={editForm.role || 'monteur'}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'monteur' })}
                              className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            >
                              <option value="monteur">Monteur</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <Input
                            label="Afdeling"
                            value={editForm.department || ''}
                            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bio
                          </label>
                          <textarea
                            value={editForm.bio || ''}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={handleCancelEdit}>
                            Annuleren
                          </Button>
                          <Button onClick={handleSaveUser}>
                            Opslaan
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center overflow-hidden">
                              <span className="text-xl font-semibold text-primary-600">
                                {user.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {user.name}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                  {user.role === 'admin' ? (
                                    <span className="flex items-center space-x-1">
                                      <Shield className="h-3 w-3" />
                                      <span>Admin</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <User className="h-3 w-3" />
                                      <span>Monteur</span>
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {user.email}
                                </span>
                                {user.phoneNumber && (
                                  <span className="flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {user.phoneNumber}
                                  </span>
                                )}
                                {user.department && (
                                  <span className="flex items-center">
                                    <Briefcase className="h-4 w-4 mr-1" />
                                    {user.department}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            icon={<Edit2 className="h-4 w-4" />}
                          >
                            Bewerken
                          </Button>
                        </div>

                        {user.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            {user.bio}
                          </p>
                        )}

                        {user.expertise && user.expertise.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expertise</h4>
                            <div className="flex flex-wrap gap-2">
                              {user.expertise.map((skill, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Gewerkte Uren</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {stats.hoursWorked.toFixed(1) || '0'}u
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Werkbonnen</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {stats.ordersCompleted || 0}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Omzet</p>
                            <p className="text-lg font-semibold text-success-600">
                              €{stats.revenue.toFixed(0) || '0'}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Kilometers</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {stats.kilometersTotal.toFixed(0) || '0'} km
                            </p>
                          </div>
                        </div>

                        {user.stats?.lastWorkOrderDate && (
                          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Laatste werkbon: {new Date(user.stats.lastWorkOrderDate).toLocaleDateString('nl-NL')}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;