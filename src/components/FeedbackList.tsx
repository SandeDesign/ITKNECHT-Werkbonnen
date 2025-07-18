import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { motion } from 'framer-motion';
import { AlertCircle, FileText, Clock, User, Flag, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './ui/Button';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  email: string;
  timestamp: string;
  deviceInfo?: string;
  attachments?: string[];
}

const FeedbackList = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError('Only administrators can view feedback submissions');
      setIsLoading(false);
      return;
    }

    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const feedbackData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FeedbackItem[];
        setFeedback(feedbackData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching feedback:', error);
        setError('Failed to load feedback submissions');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDeleteClick = (feedbackId: string) => {
    setSelectedFeedback(feedbackId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFeedback) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'feedback', selectedFeedback));
      setFeedback(prev => prev.filter(item => item.id !== selectedFeedback));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setError('Failed to delete feedback');
    } finally {
      setIsDeleting(false);
      setSelectedFeedback(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p>Only administrators can view feedback submissions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error</h3>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ideeën</h2>
        <Link to="/dashboard/feedback/create">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
          >
            Nieuw idee
          </Button>
        </Link>
      </div>

      {feedback.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nog geen ideeën</h3>
              <p>Er zijn nog geen ideeën ingediend.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4"
        >
          {feedback.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full min-w-0"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{item.title}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.priority === 'High' 
                        ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400'
                        : item.priority === 'Medium'
                        ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                        : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                    }`}>
                      {item.priority === 'High' ? 'Hoge' : item.priority === 'Medium' ? 'Gemiddelde' : 'Lage'} Prioriteit
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {item.email}
                      </span>
                      <span className="flex items-center">
                        <Flag className="h-4 w-4 mr-1" />
                        {item.category}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {item.description}
                    </p>

                    {item.deviceInfo && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg break-words">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Device Info</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.deviceInfo}</p>
                      </div>
                    )}

                    {item.attachments && item.attachments.length > 0 && (
                      <div className="mt-4 min-w-0">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Attachments
                        </h4>
                        <div className="flex flex-wrap gap-2 break-words">
                          {item.attachments.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm break-all"
                            >
                              Attachment {i + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-4">
                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item.id)}
                          icon={<Trash2 className="h-4 w-4 text-error-600" />}
                        >
                          Verwijder idee
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteConfirm}
            title="Idee verwijderen"
            message="Weet je zeker dat je dit idee wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
            isLoading={isDeleting}
          />
        </motion.div>
      )}
    </div>
  );
};

export default FeedbackList;