import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, ThumbsUp, Star, Calendar, Clock, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

const ThankYouPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
          <div className="absolute inset-0 bg-primary-500 opacity-10 rounded-full"></div>
        </div>
        <CardHeader>
          <CardTitle className="text-center">
            <motion.div 
              className="flex items-center justify-center space-x-2 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="relative">
                <CheckCircle className="w-16 h-16 text-success-500" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Star className="w-6 h-6 text-primary-500 fill-current" />
                </motion.div>
              </div>
              <ThumbsUp className="w-12 h-12 text-primary-500" />
            </motion.div>
            <motion.h2 
              className="text-2xl font-bold text-gray-900 dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Werkbon succesvol ingediend!
            </motion.h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center space-y-6"
          >
            <motion.div variants={item} className="space-y-4">
              <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
                Geweldig werk, {user?.name}! 🎉
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Je werkbon is succesvol verwerkt en opgeslagen. Je inzet wordt enorm gewaardeerd!
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString('nl-NL')}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
            
            <motion.div variants={item} className="flex justify-center">
              <Button
                onClick={() => navigate('/dashboard')}
                icon={<Home className="w-4 h-4" />}
                size="lg"
              >
                Terug naar dashboard
              </Button>
            </motion.div>
            
            <motion.p 
              variants={item}
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              Je wordt automatisch doorgestuurd over 10 seconden...
            </motion.p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ThankYouPage;