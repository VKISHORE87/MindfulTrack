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
  } = useQuery<CareerGoal>({
    queryKey: ['/api/users/career-goals/current'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Log career goal for debugging
  useEffect(() => {
    console.log("[DEBUG] CareerGoalContext - Current goal:", currentGoal);
  }, [currentGoal]);

  // Define a type for the target role response
  interface TargetRole {
    id: number;
    title: string;
    description?: string;
    requiredSkills: string[];
    [key: string]: any;  // Allow additional properties
  }

  // Query to get the target role details when currentGoal changes
  const { data: targetRole } = useQuery<TargetRole>({
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
    if (targetRole && Array.isArray(targetRole.requiredSkills)) {
      setTargetRoleSkills(targetRole.requiredSkills);
    } else {
      setTargetRoleSkills([]);
    }
  }, [targetRole]);

  // Function to update the current goal
  const updateCurrentGoal = async (goalId: number) => {
    try {
      // First, make the actual server request
      const response = await fetch(`/api/users/career-goals/${goalId}/select`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update career goal');
      }
      
      // Get the updated goal to determine the new targetRoleId
      const updatedGoal = await response.json();
      console.log("[DEBUG] Career goal updated:", updatedGoal);
      
      // Invalidate all career goal related queries
      queryClient.invalidateQueries({ queryKey: ['/api/users/career-goals/current'] });
      
      // Invalidate the target role query if there is a targetRoleId
      if (updatedGoal && updatedGoal.targetRoleId) {
        console.log("[DEBUG] Invalidating target role query:", updatedGoal.targetRoleId);
        queryClient.invalidateQueries({ 
          queryKey: [`/api/interview/roles/${updatedGoal.targetRoleId}`] 
        });
      }
      
      // Invalidate all dashboard and learning path related queries
      queryClient.invalidateQueries({ queryKey: ['/api/users/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/learning-paths'] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning-resources'] });
      
      // Force a full refetch of the current goal data
      await queryClient.refetchQueries({ 
        queryKey: ['/api/users/career-goals/current'],
        type: 'active'
      });
      
      // Force a dashboard refetch
      await queryClient.refetchQueries({ 
        queryKey: ['/api/users/dashboard'],
        type: 'active'
      });
    } catch (error) {
      console.error('Error updating career goal:', error);
    }
  };

  // Create a properly typed context value
  const contextValue: CareerGoalContextType = {
    currentGoal: currentGoal || null,
    targetRoleSkills,
    isLoading,
    error: error as Error | null,
    updateCurrentGoal
  };

  return (
    <CareerGoalContext.Provider value={contextValue}>
      {children}
    </CareerGoalContext.Provider>
  );
}

// Custom hook for using the context
export function useCareerGoal() {
  const context = useContext(CareerGoalContext);
  if (!context) {
    throw new Error('useCareerGoal must be used within a CareerGoalProvider');
  }
  return context;
}