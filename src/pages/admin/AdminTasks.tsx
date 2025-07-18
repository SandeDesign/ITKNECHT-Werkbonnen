import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { Plus, Users, Filter, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import TodoList from '../../components/dashboard/TodoList';

const AdminTasks = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const clearFilters = () => {
    setSelectedTechnician('');
  };

  const hasActiveFilters = selectedTechnician !== '';

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-primary-600" />
                  <span>Taken Beheer</span>
                </CardTitle>
                {hasActiveFilters && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    (Gefilterd op {users.find(u => u.id === selectedTechnician)?.name})
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  icon={<Filter className={`h-4 w-4 ${hasActiveFilters ? 'text-primary-600' : ''}`} />}
                >
                  Filters {hasActiveFilters && '(1)'}
                </Button>
                
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddForm(true)}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Nieuwe Taak
                </Button>
              </div>
            </div>
            
            {/* Filter Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filter op Monteur
                    </label>
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Alle monteurs</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {hasActiveFilters ? 'Filters actief' : 'Geen filters actief'}
                  </div>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      icon={<X className="h-4 w-4" />}
                    >
                      Filters wissen
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </CardHeader>
          <CardContent>
            <TodoList 
              showAll={true}
              enableAgendaView={false}
              showAddForm={showAddForm}
              onShowAddFormChange={setShowAddForm}
              filterByTechnician={selectedTechnician || undefined}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminTasks;