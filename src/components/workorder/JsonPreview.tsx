import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { ArrowLeft } from 'lucide-react';

interface JsonPreviewProps {
  data: any;
  onBack: () => void;
}

const JsonPreview = ({ data, onBack }: JsonPreviewProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Webhook Data Voorbeeld</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Terug naar formulier
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[600px]">
          <code className="text-sm">
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default JsonPreview;