import React from 'react';
import { CareerGoalProvider } from './CareerGoalContext';
import { SkillsProvider } from './SkillsContext';
import { ProgressProvider } from './ProgressContext';
import { LearningPathProvider } from './LearningPathContext';
import { TargetRoleProvider } from './TargetRoleContext';
import { UserJourneyProvider } from './UserJourneyContext';

// Combined provider component that wraps all the individual providers
export default function AppProvider({
  children,
  userId
}: {
  children: React.ReactNode;
  userId: number;
}) {
  return (
    <UserJourneyProvider>
      <CareerGoalProvider userId={userId}>
        <TargetRoleProvider userId={userId}>
          <SkillsProvider userId={userId}>
            <ProgressProvider userId={userId}>
              <LearningPathProvider userId={userId}>
                {children}
              </LearningPathProvider>
            </ProgressProvider>
          </SkillsProvider>
        </TargetRoleProvider>
      </CareerGoalProvider>
    </UserJourneyProvider>
  );
}