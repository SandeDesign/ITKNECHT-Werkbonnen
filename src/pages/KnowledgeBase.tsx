import { useState, useEffect, useCallback } from 'react';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { FileText, Clock, Search, Trash2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';

interface Article {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: string;
}

const KnowledgeBase = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleDelete = async (articleId: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'articles', articleId));
      // Refresh the list after deletion
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  const fetchArticles = useCallback(async () => {
    if (!user) {
      setError('Authentication required');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const articlesRef = collection(db, 'articles');
      const q = query(articlesRef, orderBy('timestamp', 'desc'));

      const querySnapshot = await getDocs(q);
      const fetchedArticles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];

      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Error fetching articles. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const filteredArticles = articles.filter(article => {
    const searchLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchLower) ||
      article.content.toLowerCase().includes(searchLower) ||
      article.userName.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FileText className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p>Please log in to access the knowledge base.</p>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base Articles</h2>
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <Input
              placeholder="Search articles..."
              icon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {user?.role === 'admin' && (
            <Link to="/dashboard/knowledge/create">
              <Button icon={<Plus className="h-4 w-4" />}>
                New Article
              </Button>
            </Link>
          )}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileText className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No articles found</h3>
              <p>{searchTerm ? 'No results found.' : 'No articles have been created yet.'}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6"
        >
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{article.title}</span>
                    <div className="flex items-center space-x-3">
                      {user?.role === 'admin' ? (
                        <Link 
                          to={`/dashboard/profile/${article.userId}`}
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {article.userName}
                        </Link>
                      ) : null}
                      {user?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(article.id)}
                          icon={<Trash2 className="h-4 w-4 text-error-600" />}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Created on: {new Date(article.timestamp).toLocaleDateString('nl-NL')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert">
                    {article.content}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default KnowledgeBase;