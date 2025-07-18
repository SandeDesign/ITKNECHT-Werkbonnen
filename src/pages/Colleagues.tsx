import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, Briefcase, AlertCircle } from 'lucide-react';
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
}

const Colleagues = () => {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColleagues = async () => {
      setError(null);
      
      // Check if user is authenticated
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white"></h2>
        <div className="w-64">
          <Input
            data-tutorial="colleagues-search"
            placeholder="Search colleagues..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredColleagues.map((colleague) => (
          <motion.div
            key={colleague.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 overflow-hidden">
                    {colleague.avatar ? (
                      <img src={colleague.avatar} alt={colleague.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{colleague.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <Link to={`/dashboard/colleagues/${colleague.id}`} className="hover:text-primary-600">
                    <h3 className="text-lg font-semibold">{colleague.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{colleague.role}</p>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <a href={`mailto:${colleague.email}`} className="text-primary-600 hover:underline">
                      {colleague.email}
                    </a>
                  </div>
                  {colleague.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{colleague.phone}</span>
                    </div>
                  )}
                  {colleague.department && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span>{colleague.department}</span>
                    </div>
                  )}
                  {colleague.expertise && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {colleague.expertise.map((exp, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Colleagues;