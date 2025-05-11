import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the learning path context
interface LearningPathContextType {
  // Add actual functionality as needed
  userId: number;
}

// Create the context
const LearningPathContext = createContext<LearningPathContextType | undefined>(undefined);

// Provider component
export function LearningPathProvider({ children, userId }: { children: ReactNode; userId: number }) {
  // Placeholder implementation
  const value = {
    userId
  };

  return (
    <LearningPathContext.Provider value={value}>
      {children}
    </LearningPathContext.Provider>
  );
}

// Hook for consuming the context
export function useLearningPath() {
  const context = useContext(LearningPathContext);
  if (context === undefined) {
    throw new Error('useLearningPath must be used within a LearningPathProvider');
  }
  return context;
}