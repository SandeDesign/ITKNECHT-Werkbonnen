import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import Button from './ui/Button';
import { useLocation } from 'react-router-dom';

interface TutorialStep {
  selector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  page?: string;
}

interface TutorialOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

const allTutorialSteps: Record<string, TutorialStep[]> = {
  '/dashboard': [
    {
      selector: '[data-tutorial="news-section"]',
      title: 'Nieuws & Updates',
      description: 'Hier vind je de laatste nieuwtjes en belangrijke updates van het bedrijf.',
      position: 'bottom'
    },
    {
      selector: '[data-tutorial="todo-section"]',
      title: 'Taken Overzicht',
      description: 'Beheer je dagelijkse taken en blijf op de hoogte van wat er gedaan moet worden. Taken kunnen worden afgevinkt wanneer ze zijn voltooid.',
      position: 'bottom'
    },
    {
      selector: '[data-tutorial="create-workorder"]',
      title: 'Nieuwe Werkbon',
      description: 'Maak een nieuwe werkbon aan voor je uitgevoerde werkzaamheden. Klik hier om te beginnen.',
      position: 'bottom'
    }
  ],
  '/dashboard/werkbonnen': [
    {
      selector: '[data-tutorial="workorder-search"]',
      title: 'Zoeken',
      description: 'Zoek snel door je werkbonnen op basis van adres of beschrijving.',
      position: 'bottom'
    },
    {
      selector: '[data-tutorial="workorder-list"]',
      title: 'Werkbonnen Overzicht',
      description: 'Hier vind je al je ingediende werkbonnen met details over de uitgevoerde werkzaamheden.',
      position: 'top'
    }
  ],
  '/dashboard/create': [
    {
      selector: '[data-tutorial="workorder-form"]',
      title: 'Werkbon Formulier',
      description: 'Vul hier alle details van je werkzaamheden in. Zorg dat je alle verplichte velden invult zoals datum, tijd, adres en beschrijving.',
      position: 'bottom'
    },
    {
      selector: '[data-tutorial="add-entry"]',
      title: 'Extra Werkzaamheden',
      description: 'Voeg meerdere werkzaamheden toe aan dezelfde werkbon als je op meerdere locaties bent geweest. Elk adres krijgt zijn eigen sectie met alle benodigde details.',
      position: 'bottom'
    }
  ],
  '/dashboard/colleagues': [
    {
      selector: '[data-tutorial="colleagues-search"]',
      title: 'Collega\'s Zoeken',
      description: 'Zoek collega\'s op naam, afdeling of expertise.',
      position: 'bottom'
    },
    {
      selector: '[data-tutorial="colleagues-grid"]',
      title: 'Collega Overzicht',
      description: 'Bekijk alle collega\'s en hun contactgegevens.',
      position: 'top'
    }
  ],
  '/dashboard/contacts': [
    {
      selector: '[data-tutorial="contacts-search"]',
      title: 'Contacten Zoeken',
      description: 'Zoek snel door je contacten op naam, bedrijf of afdeling.',
      position: 'bottom'
    },
    {
      selector: '[data-tutorial="contacts-grid"]',
      title: 'Contacten Overzicht',
      description: 'Hier vind je een overzicht van alle externe contacten met hun contactgegevens.',
      position: 'top'
    }
  ]
};

const TutorialOverlay = ({ isActive, onClose }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState<DOMRect | null>(null);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Get the current page's tutorial steps
  const tutorialSteps = allTutorialSteps[location.pathname] || [];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close tutorial on mobile
  useEffect(() => {
    if (isMobile && isActive) {
      onClose();
    }
  }, [isMobile, isActive, onClose]);

  // Reset current step when tutorial steps change or when becoming active
  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
    }
  }, [location.pathname, isActive]);

  const updateElementPosition = useCallback(() => {
    if (!isActive || tutorialSteps.length === 0 || currentStep >= tutorialSteps.length) return;
    
    const element = document.querySelector(tutorialSteps[currentStep].selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setElementPosition(rect);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isActive, tutorialSteps]);

  useEffect(() => {
    updateElementPosition();
    window.addEventListener('resize', updateElementPosition);
    return () => window.removeEventListener('resize', updateElementPosition);
  }, [updateElementPosition]);

  useEffect(() => {
    updateElementPosition();
  }, [currentStep, updateElementPosition]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Early return if conditions are not met, but after all hooks
  if (!isActive || !elementPosition || tutorialSteps.length === 0 || currentStep >= tutorialSteps.length || isMobile) {
    return null;
  }

  const step = tutorialSteps[currentStep];
  if (!step) return null;

  const isLastStep = currentStep === tutorialSteps.length - 1;

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!step) return { top: 0, left: 0 };
    
    const tooltipWidth = 300;
    const tooltipHeight = 120;
    const padding = 16;
    const margin = 20;
    
    let top = 0;
    let left = 0;
    
    // Always position tooltip in the center of the viewport horizontally
    left = Math.max(margin, Math.min((viewportWidth - tooltipWidth) / 2, viewportWidth - tooltipWidth - margin));
    
    // Position vertically based on the element
    top = elementPosition.bottom + padding;
    
    // Ensure tooltip stays within viewport vertically
    if (top + tooltipHeight > viewportHeight - margin) {
      top = elementPosition.top - tooltipHeight - padding;
    }
    
    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Highlight current element */}
      <div
        className="absolute bg-white/10 border-2 border-primary-500 rounded-lg pointer-events-none"
        style={{
          top: elementPosition.top - 4,
          left: elementPosition.left - 4,
          width: elementPosition.width + 8,
          height: elementPosition.height + 8
        }}
      />

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute pointer-events-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[300px]"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {step.description}
          </p>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Stap {currentStep + 1} van {tutorialSteps.length}
            </div>
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevious}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Vorige
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                {isLastStep ? 'Afronden' : 'Volgende'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialOverlay;