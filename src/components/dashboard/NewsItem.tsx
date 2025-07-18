import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Bell, BellOff, Edit2, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

interface NewsItemProps {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
  createdAt: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NewsItem = ({ id, title, content, priority, expiresAt, createdAt, onEdit, onDelete }: NewsItemProps) => {
  const { user } = useAuth();
  const { notificationsEnabled, requestPermission } = useNotifications();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(
    priority === 'high' && !notificationsEnabled
  );

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      setShowNotificationPrompt(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
      style={{
        borderLeft: priority === 'high' ? '4px solid #EF4444' : 
                  priority === 'medium' ? '4px solid #F59E0B' : 
                  '4px solid transparent',
        paddingLeft: priority !== 'low' ? '1rem' : '0'
      }}
    >
      <h3 className="font-medium text-gray-900 dark:text-white">
        {title}
        {priority !== 'low' && (
          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
            priority === 'high' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400' :
            'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
          }`}>
            {priority === 'high' ? 'Hoge prioriteit' : 'Medium prioriteit'}
          </span>
        )}
      </h3>

      {user?.role === 'admin' && (
        <div className="flex space-x-2 mt-1 mb-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              icon={<Edit2 className="h-4 w-4 text-primary-600" />}
            >
              Bewerken
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              icon={<Trash2 className="h-4 w-4 text-error-600" />}
            >
              Verwijderen
            </Button>
          )}
        </div>
      )}
      
      {showNotificationPrompt && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800"
        >
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Dit is een belangrijk bericht. Schakel notificaties in om op de hoogte te blijven.
              </p>
              <div className="mt-1 flex space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs py-1 px-2 h-auto"
                  icon={<Bell className="h-3 w-3" />}
                  onClick={handleEnableNotifications}
                >
                  Inschakelen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs py-1 px-2 h-auto"
                  onClick={() => setShowNotificationPrompt(false)}
                >
                  Niet nu
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {content}
      </p>
      <p className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>
        {new Date(createdAt).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
        {expiresAt && (
          <span className="ml-2 text-warning-600 dark:text-warning-400">
            Verloopt: {new Date(expiresAt).toLocaleDateString('nl-NL')}
          </span>
        )}
        </span>
      </p>
    </motion.div>
  );
};

export default NewsItem;