import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the progress context
interface ProgressContextType {
  // Add actual functionality as needed
  userId: number;
}

// Create the context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Provider component
export function ProgressProvider({ children, userId }: { children: ReactNode; userId: number }) {
  // Placeholder implementation
  const value = {
    userId
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// Hook for consuming the context
export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}