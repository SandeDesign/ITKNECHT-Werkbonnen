import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Download, LogIn } from 'lucide-react';
import Button from '../components/ui/Button';
import InstallPrompt from '../components/InstallPrompt';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4 py-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
      >
        <img 
          src="https://itknecht.nl/wp-content/uploads/2025/01/cropped-cropped-file-1-1-e1736278706265.webp"
          alt="IT Knecht Logo"
          className="w-24 h-24 mx-auto mb-8 rounded-xl"
        />
        
        <div className="space-y-4 w-64">
          <a 
            href="https://fl-group.org/wp-content/uploads/2025/05/itknecht.apk" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              isFullWidth
              icon={<Download className="h-5 w-5" />}
            >
              Download App
            </Button>
          </a>
          
          <Link to="/login">
            <Button
              variant="outline"
              size="lg"
              isFullWidth
              icon={<LogIn className="h-5 w-5" />}
            >
              Log in
            </Button>
          </Link>
        </div>
      </motion.div>
      <InstallPrompt />
    </div>
  );
};

export default Home;