import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { AlertCircle, Save, Send, Upload, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const feedbackSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['Bug Report', 'Feature Request', 'UI/UX Improvement', 'Performance Issue', 'Other']),
  priority: z.enum(['Low', 'Medium', 'High']),
  email: z.string().email('Please enter a valid email'),
  expectedBehavior: z.string().optional(),
  currentBehavior: z.string().optional(),
  stepsToReproduce: z.string().optional(),
  deviceInfo: z.string().optional(),
  additionalComments: z.string().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

const Feedback = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      email: user?.email || '',
      category: 'Feature Request',
      priority: 'Medium'
    }
  });

  const descriptionValue = watch('description') || '';
  const titleValue = watch('title') || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => 
      file.size <= MAX_FILE_SIZE && ACCEPTED_FILE_TYPES.includes(file.type)
    );

    if (validFiles.length + files.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FeedbackFormValues) => {
    if (previewMode) {
      setPreviewMode(false);
      return;
    }

    try {
      const feedbackData = {
        ...data,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        status: 'new'
      };

      const docRef = await addDoc(collection(db, 'feedback'), feedbackData);

      if (files.length > 0) {
        // TODO: Implement file upload to Firebase Storage
        console.log('File upload not implemented yet');
      }

      reset();
      setFiles([]);
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const saveDraft = () => {
    const formData = watch();
    localStorage.setItem('feedbackDraft', JSON.stringify({ ...formData, files }));
    setIsDraft(true);
    setTimeout(() => setIsDraft(false), 3000);
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('feedbackDraft');
    if (draft) {
      const { files: draftFiles, ...formData } = JSON.parse(draft);
      reset(formData);
      setFiles(draftFiles);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Nieuw idee indienen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Titel *"
                  error={errors.title?.message}
                  {...register('title')}
                  maxLength={100}
                  helperText={`${titleValue.length}/100 tekens`}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Beschrijving *
                  </label>
                  <textarea
                    {...register('description')}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={6}
                    maxLength={1000}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-500">
                      {descriptionValue.length}/1000 tekens
                    </span>
                    {errors.description && (
                      <span className="text-sm text-error-600">{errors.description.message}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Categorie *
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="Bug Report">Bug Melding</option>
                      <option value="Feature Request">Nieuwe Functie</option>
                      <option value="UI/UX Improvement">UI/UX Verbetering</option>
                      <option value="Performance Issue">Prestatie Probleem</option>
                      <option value="Other">Anders</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prioriteit *
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="Low">Laag</option>
                      <option value="Medium">Gemiddeld</option>
                      <option value="High">Hoog</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="E-mail *"
                  type="email"
                  error={errors.email?.message}
                  {...register('email')}
                  placeholder="your.email@example.com"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aanvullende opmerkingen
                  </label>
                  <textarea
                    {...register('additionalComments')}
                    className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 border rounded-lg border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                icon={<Save className="h-4 w-4" />}
              >
                {isDraft ? 'Opgeslagen!' : 'Concept opslaan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadDraft}
              >
                Concept laden
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewMode(true)}
              >
                Voorbeeld
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                icon={<Send className="h-4 w-4" />}
              >
                Idee indienen
              </Button>
            </div>
          </CardFooter>
        </Card>

        {previewMode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Voorbeeld idee</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode(false)}
                    icon={<X className="h-4 w-4" />}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium">Titel</h3>
                    <p>{watch('title')}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Beschrijving</h3>
                    <p className="whitespace-pre-wrap">{watch('description')}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium">Categorie</h3>
                      <p>{watch('category')}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Prioriteit</h3>
                      <p>{watch('priority')}</p>
                    </div>
                  </div>
                  {files.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium">Attachments</h3>
                      <ul className="list-disc list-inside">
                        {files.map((file, index) => (
                          <li key={index}>{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {watch('category') === 'Bug Report' && (
                    <>
                      {watch('expectedBehavior') && (
                        <div>
                          <h3 className="text-lg font-medium">Expected Behavior</h3>
                          <p className="whitespace-pre-wrap">{watch('expectedBehavior')}</p>
                        </div>
                      )}
                      {watch('currentBehavior') && (
                        <div>
                          <h3 className="text-lg font-medium">Current Behavior</h3>
                          <p className="whitespace-pre-wrap">{watch('currentBehavior')}</p>
                        </div>
                      )}
                      {watch('stepsToReproduce') && (
                        <div>
                          <h3 className="text-lg font-medium">Steps to Reproduce</h3>
                          <p className="whitespace-pre-wrap">{watch('stepsToReproduce')}</p>
                        </div>
                      )}
                    </>
                  )}
                  {watch('deviceInfo') && (
                    <div>
                      <h3 className="text-lg font-medium">Device Information</h3>
                      <p>{watch('deviceInfo')}</p>
                    </div>
                  )}
                  {watch('additionalComments') && (
                    <div>
                      <h3 className="text-lg font-medium">Additional Comments</h3>
                      <p className="whitespace-pre-wrap">{watch('additionalComments')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleSubmit(onSubmit)}
                  isLoading={isSubmitting}
                  icon={<Send className="h-4 w-4" />}
                >
                  Idee indienen
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Feedback;