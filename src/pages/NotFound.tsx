import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
          <div className="h-2 w-24 bg-primary-600 dark:bg-primary-400 mx-auto my-4 rounded-full"></div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Page not found</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link to="/">
            <Button variant="outline" icon={<Home className="h-4 w-4" />}>
              Go to Home
            </Button>
          </Link>
          <Button 
            variant="primary" 
            icon={<ArrowLeft className="h-4 w-4" />} 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;