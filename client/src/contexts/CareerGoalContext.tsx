import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { CareerGoal } from '@shared/schema';

// Define the context type
interface CareerGoalContextType {
  currentGoal: CareerGoal | null;
  targetRoleSkills: string[];
  isLoading: boolean;
  error: Error | null;
  updateCurrentGoal: (goalId: number) => Promise<void>;
}

// Create the context with default values
const CareerGoalContext = createContext<CareerGoalContextType>({
  currentGoal: null,
  targetRoleSkills: [],
  isLoading: false,
  error: null,
  updateCurrentGoal: async () => {}
});

// Provider component
export const CareerGoalProvider = ({ children }: { children: ReactNode }) => {
  const [targetRoleSkills, setTargetRoleSkills] = useState<string[]>([]);

  // Query to get the current career goal
  const { 
    data: currentGoal,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/users/career-goals/current'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Log career goal for debugging
  useEffect(() => {
    console.log("[DEBUG] CareerGoalContext - Current goal:", currentGoal);
  }, [currentGoal]);

  // Query to get the target role details when currentGoal changes
  const { data: targetRole } = useQuery({
    queryKey: [`/api/interview/roles/${currentGoal?.targetRoleId || 0}`],
    enabled: !!currentGoal?.targetRoleId,
    staleTime: 1000 * 60 * 30, // 30 minutes, roles change less frequently
  });
  
  // Log target role for debugging
  useEffect(() => {
    console.log("[DEBUG] CareerGoalContext - Target role:", targetRole);
  }, [targetRole]);

  // Update targetRoleSkills whenever targetRole changes
  useEffect(() => {
    if (targetRole?.requiredSkills) {
      setTargetRoleSkills(targetRole.requiredSkills);
    } else {
      setTargetRoleSkills([]);
    }
  }, [targetRole]);

  // Function to update the current goal
  const updateCurrentGoal = async (goalId: number) => {
    try {
      await fetch(`/api/users/career-goals/${goalId}/select`, {
        method: 'POST',
      });
      
      // Invalidate queries that depend on the current goal
      queryClient.invalidateQueries({ queryKey: ['/api/users/career-goals/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/learning-paths'] });
    } catch (error) {
      console.error('Error updating career goal:', error);
    }
  };

  return (
    <CareerGoalContext.Provider 
      value={{ 
        currentGoal: currentGoal || null, 
        targetRoleSkills, 
        isLoading, 
        error: error as Error | null,
        updateCurrentGoal
      }}
    >
      {children}
    </CareerGoalContext.Provider>
  );
}

// Custom hook for using the context
export const useCareerGoal = () => {
  const context = useContext(CareerGoalContext);
  if (!context) {
    throw new Error('useCareerGoal must be used within a CareerGoalProvider');
  }
  return context;
}