import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FileText, ArrowLeft, AlertCircle } from 'lucide-react';

const CreateArticle = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technical');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
            <p>You must be logged in to create an article.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-error-600 dark:text-error-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p>Only administrators can create knowledge base articles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const knowledgeBaseRef = collection(db, 'articles');
      await addDoc(knowledgeBaseRef, {
        title,
        content,
        category,
        userName: user.name || 'Anonymous',
        userId: user.id,
        timestamp: Timestamp.now(),
      });

      navigate('/dashboard/knowledge');
    } catch (error) {
      console.error('Error creating article:', error);
      setError('Failed to create article. Please check your permissions and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['Installation', 'Technical', 'Best Practices', 'Troubleshooting'];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Article</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard/knowledge')}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Knowledge Base
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 text-sm text-red-800 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-200">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Title"
              type="text"
              placeholder="Enter article title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[200px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter article content"
                required
              />
            </div>
            <Button type="submit" isLoading={isSubmitting} icon={<FileText className="h-4 w-4" />}>
              Create Article
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateArticle;