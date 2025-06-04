import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  isRequired: boolean;
}

interface UserJourneyContextType {
  currentStep: string;
  steps: JourneyStep[];
  setCurrentStep: (stepId: string) => void;
  completeStep: (stepId: string) => void;
  getNextStep: () => JourneyStep | null;
  getPreviousStep: () => JourneyStep | null;
  getProgressPercentage: () => number;
  isStepAccessible: (stepId: string) => boolean;
  resetJourney: () => void;
}

const UserJourneyContext = createContext<UserJourneyContextType | undefined>(undefined);

const INITIAL_STEPS: JourneyStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Your career development hub',
    icon: '📊',
    path: '/dashboard',
    isCompleted: false,
    isUnlocked: true,
    isRequired: false
  },
  {
    id: 'profile',
    title: 'Profile Setup',
    description: 'Set up your basic profile information',
    icon: '👤',
    path: '/profile',
    isCompleted: false,
    isUnlocked: true,
    isRequired: true
  },
  {
    id: 'assessment',
    title: 'Skill Assessment',
    description: 'Understand your current skills and interests',
    icon: '🧠',
    path: '/skill-assessments',
    isCompleted: false,
    isUnlocked: false,
    isRequired: true
  },
  {
    id: 'goals',
    title: 'Career Goals',
    description: 'Define your target role and career objectives',
    icon: '🎯',
    path: '/career-options',
    isCompleted: false,
    isUnlocked: false,
    isRequired: true
  },
  {
    id: 'gap-analysis',
    title: 'Skill Gap Analysis',
    description: 'Identify what skills need development',
    icon: '📈',
    path: '/skills',
    isCompleted: false,
    isUnlocked: false,
    isRequired: true
  },
  {
    id: 'learning',
    title: 'Learning Path',
    description: 'Generate personalized learning roadmap',
    icon: '📚',
    path: '/resources',
    isCompleted: false,
    isUnlocked: false,
    isRequired: true
  },
  {
    id: 'progress',
    title: 'Progress Tracking',
    description: 'Monitor your advancement and milestones',
    icon: '📊',
    path: '/progress',
    isCompleted: false,
    isUnlocked: false,
    isRequired: true
  },
  {
    id: 'validation',
    title: 'Skill Validation',
    description: 'Test your skills and get feedback',
    icon: '✅',
    path: '/validation',
    isCompleted: false,
    isUnlocked: false,
    isRequired: true
  }
];

const STORAGE_KEY = 'upcraft_user_journey';

export function UserJourneyProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStepState] = useState<string>('dashboard');
  const [steps, setSteps] = useState<JourneyStep[]>(INITIAL_STEPS);

  // Load journey state from localStorage on mount
  useEffect(() => {
    const savedJourney = localStorage.getItem(STORAGE_KEY);
    if (savedJourney) {
      try {
        const { currentStep: savedCurrentStep, steps: savedSteps } = JSON.parse(savedJourney);
        setCurrentStepState(savedCurrentStep);
        setSteps(savedSteps);
      } catch (error) {
        console.error('Failed to load journey state:', error);
      }
    }
  }, []);

  // Save journey state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep, steps }));
  }, [currentStep, steps]);

  // Update step unlock status based on completion
  useEffect(() => {
    setSteps(prevSteps => {
      const updatedSteps = [...prevSteps];
      
      for (let i = 0; i < updatedSteps.length; i++) {
        const step = updatedSteps[i];
        
        // Dashboard is always unlocked
        if (step.id === 'dashboard') {
          step.isUnlocked = true;
          continue;
        }
        
        // Check if previous required steps are completed
        const previousSteps = updatedSteps.slice(0, i);
        const requiredPreviousSteps = previousSteps.filter(s => s.isRequired);
        const allPreviousCompleted = requiredPreviousSteps.length === 0 || 
          requiredPreviousSteps.every(s => s.isCompleted);
        
        step.isUnlocked = allPreviousCompleted;
      }
      
      return updatedSteps;
    });
  }, [steps]);

  const setCurrentStep = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step && step.isUnlocked) {
      setCurrentStepState(stepId);
    }
  };

  const completeStep = (stepId: string) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, isCompleted: true } : step
      )
    );
  };

  const getNextStep = (): JourneyStep | null => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex === -1 || currentIndex === steps.length - 1) return null;
    
    for (let i = currentIndex + 1; i < steps.length; i++) {
      if (steps[i].isUnlocked) {
        return steps[i];
      }
    }
    return null;
  };

  const getPreviousStep = (): JourneyStep | null => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex <= 0) return null;
    
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (steps[i].isUnlocked) {
        return steps[i];
      }
    }
    return null;
  };

  const getProgressPercentage = (): number => {
    const requiredSteps = steps.filter(s => s.isRequired);
    const completedRequired = requiredSteps.filter(s => s.isCompleted);
    return requiredSteps.length > 0 ? (completedRequired.length / requiredSteps.length) * 100 : 0;
  };

  const isStepAccessible = (stepId: string): boolean => {
    const step = steps.find(s => s.id === stepId);
    return step ? step.isUnlocked : false;
  };

  const resetJourney = () => {
    setSteps(INITIAL_STEPS);
    setCurrentStepState('dashboard');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserJourneyContext.Provider
      value={{
        currentStep,
        steps,
        setCurrentStep,
        completeStep,
        getNextStep,
        getPreviousStep,
        getProgressPercentage,
        isStepAccessible,
        resetJourney
      }}
    >
      {children}
    </UserJourneyContext.Provider>
  );
}

export function useUserJourney() {
  const context = useContext(UserJourneyContext);
  if (context === undefined) {
    throw new Error('useUserJourney must be used within a UserJourneyProvider');
  }
  return context;
}