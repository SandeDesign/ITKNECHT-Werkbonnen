import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, Briefcase, AlertCircle, MapPin, Star, MessageCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import { Link } from 'react-router-dom';

interface Colleague {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  expertise?: string[];
  phone?: string;
  projects?: string[];
  avatar?: string;
  bio?: string;
}

const Colleagues = () => {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColleagues = async () => {
      setError(null);
      
      if (!auth.currentUser) {
        setError('Please sign in to view colleagues');
        setIsLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const colleaguesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Colleague[];
        setColleagues(colleaguesData);
      } catch (error) {
        console.error('Error fetching colleagues:', error);
        setError('Unable to load colleagues. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchColleagues();
  }, []);

  const filteredColleagues = colleagues.filter(colleague => {
    const searchLower = searchTerm.toLowerCase();
    return (
      colleague.name?.toLowerCase().includes(searchLower) ||
      colleague.email?.toLowerCase().includes(searchLower) ||
      colleague.department?.toLowerCase().includes(searchLower) ||
      colleague.expertise?.some(exp => exp.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span className="text-lg font-medium">{error}</span>
        </div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      monteur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      default: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return colors[role] || colors.default;
  };

  return (
    <div className="space-y-6">
      {/* Header met Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredColleagues.length} {filteredColleagues.length === 1 ? 'collega' : 'collega\'s'}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            data-tutorial="colleagues-search"
            placeholder="Zoek op naam, afdeling, expertise..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid met moderne cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredColleagues.map((colleague, index) => (
          <motion.div
            key={colleague.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`/dashboard/colleagues/${colleague.id}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                {/* Gradient header */}
                <div className="h-24 bg-gradient-to-br from-primary-500 to-primary-700 relative">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
                </div>
                
                <CardContent className="pt-0 pb-6 px-6 -mt-12 relative">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 p-1 shadow-lg">
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 text-2xl font-bold overflow-hidden">
                          {colleague.avatar ? (
                            <img src={colleague.avatar} alt={colleague.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{colleague.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      {/* Online status badge */}
                      <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {colleague.name}
                    </h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getRoleColor(colleague.role)}`}>
                      {colleague.role}
                    </span>
                  </div>

                  {/* Quick info */}
                  <div className="space-y-2 mb-4">
                    {colleague.department && (
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Briefcase className="h-4 w-4" />
                        <span className="truncate">{colleague.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Expertise tags */}
                  {colleague.expertise && colleague.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                      {colleague.expertise.slice(0, 3).map((exp, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded-md bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                        >
                          {exp}
                        </span>
                      ))}
                      {colleague.expertise.length > 3 && (
                        <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          +{colleague.expertise.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <a 
                      href={`mailto:${colleague.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">Email</span>
                    </a>
                    {colleague.phone && (
                      <a 
                        href={`tel:${colleague.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Bel</span>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {filteredColleagues.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Geen collega's gevonden
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Probeer een andere zoekterm
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default Colleagues;