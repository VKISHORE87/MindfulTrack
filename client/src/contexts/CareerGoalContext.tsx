import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Types for career goal data
export interface CareerGoal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  timelineMonths?: number;
  targetDate?: string | null;
  targetRoleId: number;
  createdAt: string;
}

export interface TargetRole {
  id: number;
  title: string;
  description?: string;
  requiredSkills: string[];
  requiredSkillLevels?: Record<string, number>;
  industry?: string;
  level?: string;
  roleType?: string;
  averageSalary?: string;
  growthRate?: string;
  demandScore?: number;
  createdAt?: string;
}

interface CareerGoalContextType {
  currentGoal: CareerGoal | null;
  targetRole: TargetRole | null;
  targetRoleSkills: string[];
  isLoadingGoal: boolean;
  isLoadingRole: boolean;
  goalError: Error | null;
  roleError: Error | null;
  refetchGoal: () => Promise<void>;
}

export const CareerGoalContext = createContext<CareerGoalContextType | null>(null);

interface CareerGoalProviderProps {
  children: ReactNode;
}

export const CareerGoalProvider: React.FC<CareerGoalProviderProps> = ({
  children
}) => {
  const { toast } = useToast();
  const [currentGoal, setCurrentGoal] = useState<CareerGoal | null>(null);
  const [targetRole, setTargetRole] = useState<TargetRole | null>(null);
  const [targetRoleSkills, setTargetRoleSkills] = useState<string[]>([]);

  // Fetch current career goal
  const {
    data: goalData,
    isLoading: isLoadingGoal,
    error: goalError,
    refetch: refetchGoal
  } = useQuery<CareerGoal, Error>({
    queryKey: ['/api/users/career-goals/current'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    onError: () => {
      // Don't show toast for missing career goal
      // This is a normal state when user hasn't set a goal yet
    }
  });

  // Update current goal state when data changes
  useEffect(() => {
    if (goalData) {
      setCurrentGoal(goalData);
      console.debug('[DEBUG] CareerGoalContext - Current goal:', goalData);
    }
  }, [goalData]);

  // Fetch target role data when current goal changes
  const {
    data: roleData,
    isLoading: isLoadingRole,
    error: roleError
  } = useQuery<TargetRole, Error>({
    queryKey: ['/api/interview/roles', currentGoal?.targetRoleId],
    enabled: !!currentGoal?.targetRoleId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      toast({
        title: 'Error Loading Target Role',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update target role state when data changes
  useEffect(() => {
    if (roleData) {
      setTargetRole(roleData);
      console.debug('[DEBUG] CareerGoalContext - Target role:', roleData);
      
      // Extract required skills from the target role
      const skills = roleData.requiredSkills || [];
      setTargetRoleSkills(skills);
    }
  }, [roleData]);

  return (
    <CareerGoalContext.Provider
      value={{
        currentGoal,
        targetRole,
        targetRoleSkills,
        isLoadingGoal,
        isLoadingRole,
        goalError,
        roleError,
        refetchGoal,
      }}
    >
      {children}
    </CareerGoalContext.Provider>
  );
};

export const useCareerGoal = () => {
  const context = useContext(CareerGoalContext);
  if (!context) {
    throw new Error('useCareerGoal must be used within a CareerGoalProvider');
  }
  return context;
};