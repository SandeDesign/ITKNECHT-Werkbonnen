import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StatisticsService, PersonalStats } from '../services/StatisticsService';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowLeft, Mail, Phone, Briefcase, MapPin, Award, TrendingUp, Clock, Navigation, Calendar, Star } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profiel</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bekijk details en statistieken</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/colleagues')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Terug
        </Button>
      </div>

      {/* Hero Card met Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          {/* Gradient Banner */}
          <div className="h-32 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>
          </div>
          
          <CardContent className="pt-0 px-6 pb-6 -mt-16 relative">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-white dark:bg-gray-800 p-1.5 shadow-xl">
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-300 text-4xl font-bold overflow-hidden">
                    {colleague.avatar ? (
                      <img src={colleague.avatar} alt={colleague.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span>{colleague.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>
                {/* Online status */}
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
              </div>

              {/* Name & Role */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{colleague.name}</h1>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(colleague.role)}`}>
                    <Award className="h-4 w-4 mr-1.5" />
                    {colleague.role}
                  </span>
                  {colleague.department && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      <Briefcase className="h-4 w-4 mr-1.5" />
                      {colleague.department}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <a 
                  href={`mailto:${colleague.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </a>
                {colleague.phoneNumber && (
                  <a 
                    href={`tel:${colleague.phoneNumber}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="hidden sm:inline">Bel</span>
                  </a>
                )}
              </div>
            </div>

            {/* Bio */}
            {colleague.bio && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{colleague.bio}</p>
              </div>
            )}

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <a href={`mailto:${colleague.email}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate block">
                    {colleague.email}
                  </a>
                </div>
              </div>

              {colleague.phoneNumber && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Telefoon</p>
                    <a href={`tel:${colleague.phoneNumber}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600">
                      {colleague.phoneNumber}
                    </a>
                  </div>
                </div>
              )}

              {colleague.department && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Afdeling</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {colleague.department}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Expertise */}
            {colleague.expertise && colleague.expertise.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary-600" />
                  Expertise
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colleague.expertise.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium border border-primary-200 dark:border-primary-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistieken */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Werkstatistieken
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : colleagueStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{colleagueStats.totalHoursWorked.toFixed(1)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Uren Gewerkt</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{colleagueStats.totalWorkOrdersCompleted}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Werkbonnen Voltooid</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <Navigation className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{colleagueStats.totalKilometersDriven.toFixed(0)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Kilometers Gereden</p>
                  </div>
                </div>

                {colleagueStats.lastWorkOrderDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-2">
                    <Calendar className="h-4 w-4" />
                    <span>Laatste werkbon: {new Date(colleagueStats.lastWorkOrderDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Geen statistieken beschikbaar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects */}
      {colleague.projects && colleague.projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary-600" />
                Recente Projecten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {colleague.projects.map((project: string, index: number) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{project}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default ColleagueProfile;