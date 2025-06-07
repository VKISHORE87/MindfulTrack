import React, { createContext, useContext, ReactNode } from 'react';

// Define the shape of the skills context
interface SkillsContextType {
  // Add actual functionality as needed
  userId: number;
}

// Create the context
const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

// Provider component
export function SkillsProvider({ children, userId }: { children: ReactNode; userId: number }) {
  // Placeholder implementation
  const value = {
    userId
  };

  return (
    <SkillsContext.Provider value={value}>
      {children}
    </SkillsContext.Provider>
  );
}

// Hook for consuming the context
export function useSkills() {
  const context = useContext(SkillsContext);
  if (context === undefined) {
    throw new Error('useSkills must be used within a SkillsProvider');
  }
  return context;
}