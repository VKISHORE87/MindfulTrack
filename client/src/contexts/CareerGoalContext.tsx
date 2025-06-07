import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CareerGoal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  timelineMonths: number;
  targetDate?: string;
  currentRoleId?: number;
  targetRoleId?: number;
  createdAt: string;
}

interface CareerGoalContextType {
  currentGoal: CareerGoal | null;
  isLoading: boolean;
  error: Error | null;
  refetchGoal: () => void;
  targetRoleSkills: string[]; // Add targetRoleSkills property
}

const CareerGoalContext = createContext<CareerGoalContextType | undefined>(undefined);

export function CareerGoalProvider({ children, userId }: { children: React.ReactNode; userId: number }) {
  const [currentGoal, setCurrentGoal] = useState<CareerGoal | null>(null);
  const [targetRoleSkills, setTargetRoleSkills] = useState<string[]>([]);
  
  const { data, isLoading, error, refetch } = useQuery<CareerGoal, Error>({
    queryKey: ['/api/users/career-goals/current'],
    staleTime: 1000 * 60 * 2, // 2 minutes - more frequent updates for career goals
  });
  
  // Query target role data from API
  const { data: roles } = useQuery<any[], Error>({
    queryKey: ['/api/interview/roles'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  useEffect(() => {
    if (data) {
      console.log('[DEBUG] CareerGoalContext - Current goal:', data);
      setCurrentGoal(data);
      
      // Find target role skills from roles data if available
      if (roles && data.targetRoleId) {
        console.log('[DEBUG] CareerGoalContext - Target role:', roles);
        const targetRole = roles.find(role => role.id === data.targetRoleId);
        if (targetRole && targetRole.requiredSkills) {
          setTargetRoleSkills(targetRole.requiredSkills);
        }
      }
    }
  }, [data, roles]);
  
  return (
    <CareerGoalContext.Provider
      value={{
        currentGoal,
        isLoading,
        error,
        refetchGoal: refetch,
        targetRoleSkills // Provide targetRoleSkills to consumers
      }}
    >
      {children}
    </CareerGoalContext.Provider>
  );
}

export function useCareerGoal() {
  const context = useContext(CareerGoalContext);
  if (context === undefined) {
    throw new Error('useCareerGoal must be used within a CareerGoalProvider');
  }
  return context;
}