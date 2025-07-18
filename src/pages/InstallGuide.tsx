import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Apple, Smartphone, Chrome, Download } from 'lucide-react';

const InstallGuide = () => {
  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Installatie Handleiding
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Volg deze stappen om IT Knecht als app te installeren op je apparaat
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Apple className="h-6 w-6" />
                iOS Installatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3">
                <li>Open Safari en ga naar de <a href="https://kaleidoscopic-alfajores-5cae0f.netlify.app/dashboard" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">IT Knecht website</a></li>
                <li>Tik op het 'Delen' icoon (vierkant met pijl omhoog)</li>
                <li>Scroll naar beneden en tik op 'Zet op beginscherm'</li>
                <li>Tik op 'Voeg toe' rechtsboven</li>
              </ol>
              <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                <p className="text-primary-700 dark:text-primary-300 text-sm">
                  Tip: De app wordt nu als een native app op je beginscherm geplaatst
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-6 w-6" />
                Android Installatie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="font-medium">Methode 1: Via Chrome</p>
                <ol className="list-decimal list-inside space-y-3">
                  <li>Open Chrome en ga naar de <a href="https://kaleidoscopic-alfajores-5cae0f.netlify.app/dashboard" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">IT Knecht website</a></li>
                  <li>Tik op de drie puntjes rechtsboven</li>
                  <li>Kies 'App installeren' of 'Toevoegen aan startscherm'</li>
                  <li>Tik op 'Installeren'</li>
                </ol>
              </div>
              
              <div className="space-y-3">
                <p className="font-medium">Methode 2: APK Installatie</p>
                <ol className="list-decimal list-inside space-y-3">
                  <li>Download de APK via de downloadknop op de homepage</li>
                  <li>Open het gedownloade bestand</li>
                  <li>Volg de installatie-instructies</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InstallGuide;