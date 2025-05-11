import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CareerGoal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  timelineMonths: number;
  targetDate?: string;
  targetRoleId?: number;
  createdAt: string;
}

interface CareerGoalContextType {
  currentGoal: CareerGoal | null;
  isLoading: boolean;
  error: Error | null;
  refetchGoal: () => void;
}

const CareerGoalContext = createContext<CareerGoalContextType | undefined>(undefined);

export function CareerGoalProvider({ children, userId }: { children: React.ReactNode; userId: number }) {
  const [currentGoal, setCurrentGoal] = useState<CareerGoal | null>(null);
  
  const { data, isLoading, error, refetch } = useQuery<CareerGoal, Error>({
    queryKey: ['/api/users/career-goals/current'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  useEffect(() => {
    if (data) {
      console.log('[DEBUG] CareerGoalContext - Current goal:', data);
      setCurrentGoal(data);
    }
  }, [data]);
  
  return (
    <CareerGoalContext.Provider
      value={{
        currentGoal,
        isLoading,
        error,
        refetchGoal: refetch
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