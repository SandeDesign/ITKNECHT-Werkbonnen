import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ArrowLeft, BookOpen } from 'lucide-react';

const ArticleView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;

      try {
        const articleDocRef = doc(db, 'knowledgeBase', id);
        const articleDoc = await getDoc(articleDocRef);

        if (articleDoc.exists()) {
          setArticle({ id: articleDoc.id, ...articleDoc.data() });
        } else {
          console.log('Article not found');
          alert('Article not found.');
          navigate('/dashboard/knowledge');
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        alert('Failed to load article.');
        navigate('/dashboard/knowledge');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-primary-600 dark:text-primary-400">
                  {article.category}
                </span>
                <span className="text-xs text-gray-500">
                  Version {article.version}
                </span>
              </div>
              <CardTitle>{article.title}</CardTitle>
              <CardDescription>
                By {article.author} • {article.createdAt.toDate().toLocaleDateString()}
              </CardDescription>
            </div>
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
          <div className="prose dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{article.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticleView;