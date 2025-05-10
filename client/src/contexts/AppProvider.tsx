import React, { ReactNode } from 'react';
import { CareerGoalProvider } from './CareerGoalContext';
import { ProgressProvider } from './ProgressContext';
import { SkillsProvider } from './SkillsContext';
import { LearningPathProvider } from './LearningPathContext';

interface AppProviderProps {
  children: ReactNode;
  userId: number;
}

// This provider combines all context providers into a single component
// The order is important - some contexts depend on others
export const AppProvider: React.FC<AppProviderProps> = ({ children, userId }) => {
  return (
    <CareerGoalProvider>
      <SkillsProvider userId={userId}>
        <ProgressProvider userId={userId}>
          <LearningPathProvider userId={userId}>
            {children}
          </LearningPathProvider>
        </ProgressProvider>
      </SkillsProvider>
    </CareerGoalProvider>
  );
};

export default AppProvider;