import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import Button from './ui/Button';

interface WebmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const WebmailModal = ({ isOpen, onClose, onConfirm }: WebmailModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
                    Externe Link
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    icon={<X className="h-4 w-4" />}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  U verlaat nu de app om naar de webmail te gaan
                </p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Annuleren
                </Button>
                <Button onClick={onConfirm}>
                  Doorgaan
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default WebmailModal;