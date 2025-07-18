import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StatisticsService, PersonalStats } from '../services/StatisticsService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Mail, Phone, Briefcase, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ColleagueProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [colleague, setColleague] = useState<any>(null);
  const [colleagueStats, setColleagueStats] = useState<PersonalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchColleague = async () => {
      if (!id) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          setColleague({
            id: userDoc.id,
            ...userDoc.data()
          });
          
          // Fetch statistics for this colleague
          try {
            if (id) {
              const stats = await StatisticsService.getUserOverallStats(id);
              setColleagueStats(stats);
            }
          } catch (statsError) {
            console.error('Error fetching colleague statistics:', statsError);
          } finally {
            setIsLoadingStats(false);
          }
        } else {
          navigate('/dashboard/colleagues');
        }
      } catch (error) {
        console.error('Error fetching colleague:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchColleague();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!colleague) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profiel</h2>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/colleagues')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Al je collega's
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-semibold overflow-hidden">
                {colleague.avatar ? (
                  <img src={colleague.avatar} alt={colleague.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{colleague.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">{colleague.name}</CardTitle>
                <p className="text-gray-500 dark:text-gray-400 capitalize">{colleague.role}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                    <Mail className="h-5 w-5" />
                    <a href={`mailto:${colleague.email}`} className="hover:text-primary-600">
                      {colleague.email}
                    </a>
                  </div>
                  {colleague.phoneNumber && (
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Phone className="h-5 w-5" />
                      <a href={`tel:${colleague.phoneNumber}`} className="hover:text-primary-600">
                        {colleague.phoneNumber}
                      </a>
                    </div>
                  )}
                  {colleague.department && (
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                      <Briefcase className="h-5 w-5" />
                      <span>{colleague.department}</span>
                    </div>
                  )}
                </div>
              </div>

              {colleague.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">About</h3>
                  <p className="text-gray-600 dark:text-gray-300">{colleague.bio}</p>
                </div>
              )}
            </div>

            {colleague.expertise && colleague.expertise.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {colleague.expertise.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Werkstatistieken</h3>
              {isLoadingStats ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              ) : colleagueStats ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500">Totaal Gewerkt</p>
                      <p className="text-xl font-semibold mt-1">{colleagueStats.totalHoursWorked.toFixed(1)} uur</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500">Werkbonnen Voltooid</p>
                      <p className="text-xl font-semibold mt-1">{colleagueStats.totalWorkOrdersCompleted}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-500">Totaal Gereden</p>
                      <p className="text-xl font-semibold mt-1">{colleagueStats.totalKilometersDriven.toFixed(0)} km</p>
                    </div>
                  </div>
                  {colleagueStats.lastWorkOrderDate && (
                    <p className="mt-4 text-sm text-gray-500">
                      Laatste werkbon: {new Date(colleagueStats.lastWorkOrderDate).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p>Geen statistieken beschikbaar</p>
                </div>
              )}
            </div>

            {colleague.projects && colleague.projects.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Projects</h3>
                <div className="space-y-3">
                  {colleague.projects.map((project: string, index: number) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                      {project}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default ColleagueProfile;