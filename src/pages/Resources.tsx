import { motion } from 'framer-motion';
import OwnCloudLinks from '../components/dashboard/OwnCloudLinks';

const Resources = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 text-gray-700 dark:text-gray-300">
        <p className="mb-2">Als je klikt op een van de onderstaande links, download je direct het document in een nieuw venster.</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <OwnCloudLinks />
      </motion.div>
    </div>
  );
};

export default Resources;