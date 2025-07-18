import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { FileText, PenTool as Tool, ExternalLink } from 'lucide-react';

interface OwnCloudLink {
  title: string;
  url: string;
  category: 'Documentation' | 'Tools' | 'Tools';
}

const OwnCloudLinks = () => {
  const [links, setLinks] = useState<OwnCloudLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await fetch('/ownCloudLinks.json');
        if (!response.ok) {
          throw new Error('Failed to fetch links');
        }
        const data = await response.json();
        setLinks(data);
      } catch (error) {
        console.error('Failed to fetch ownCloud links:', error);
        setError('Failed to load resources');
      }
    };

    fetchLinks();
  }, []);

  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, OwnCloudLink[]>);

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-error-600 dark:text-error-400 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary-600" />
          <span>Bronnen</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                {category === 'Documentation' ? (
                  <FileText className="h-4 w-4 mr-1 text-gray-500" />
                ) : (
                  <Tool className="h-4 w-4 mr-1 text-gray-500" />
                )}
                {category}
              </h3>
              <div className="space-y-2">
                {categoryLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-primary-600 dark:text-primary-400 hover:underline group"
                  >
                    <span>{link.title}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnCloudLinks;