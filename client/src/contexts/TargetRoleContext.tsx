import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useCareerGoal } from './CareerGoalContext';
import { useToast } from '@/hooks/use-toast';

interface TargetRole {
  id: number;
  title: string;
  requiredSkills: string[];
  category?: string;
  industry?: string;
  level?: string;
}

interface TargetRoleContextType {
  targetRole: TargetRole | null;
  isLoading: boolean;
  error: Error | null;
  setTargetRole: (roleId: number, roleTitle: string, requiredSkills: string[]) => Promise<void>;
  clearTargetRole: () => void;
}

const TargetRoleContext = createContext<TargetRoleContextType | undefined>(undefined);

export function TargetRoleProvider({ children, userId }: { children: React.ReactNode; userId: number }) {
  const [targetRole, setTargetRoleState] = useState<TargetRole | null>(null);
  const { toast } = useToast();
  const { currentGoal } = useCareerGoal();
  
  // Get all available roles
  const { data: roles, isLoading, error } = useQuery<any[], Error>({
    queryKey: ['/api/interview/roles'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Mutation to update target role
  const updateTargetRoleMutation = useMutation({
    mutationFn: async ({ targetRoleId }: { targetRoleId: number }) => {
      // If we have a current goal with a targetRoleId, update it
      if (currentGoal?.id) {
        return await apiRequest('PATCH', `/api/users/${userId}/career-goals/${currentGoal.id}`, {
          targetRoleId,
        });
      } else {
        // Otherwise create a new career goal with this target role
        return await apiRequest('POST', `/api/users/${userId}/career-goals`, {
          targetRoleId,
          timelineMonths: 12, // Default timeline
        });
      }
    },
  });
  
  // Initialize target role from current goal ONLY if targetRole is null
  // This ensures we don't override a user-selected target role when navigating between tabs
  useEffect(() => {
    // Only initialize if we don't already have a target role set
    if (!targetRole && currentGoal?.targetRoleId && roles) {
      const role = roles.find(r => r.id === currentGoal.targetRoleId);
      if (role) {
        console.log("[DEBUG] Initializing target role from current goal:", role.title);
        setTargetRoleState({
          id: role.id,
          title: role.title,
          requiredSkills: role.requiredSkills || [],
          category: role.category,
          industry: role.industry,
          level: role.level
        });
      }
    }
  }, [currentGoal, roles, targetRole]);
  
  // Function to set target role
  const setTargetRole = async (roleId: number, roleTitle: string, requiredSkills: string[]) => {
    try {
      await updateTargetRoleMutation.mutateAsync({ targetRoleId: roleId });
      
      // Update local state
      setTargetRoleState({
        id: roleId,
        title: roleTitle,
        requiredSkills: requiredSkills,
      });
      
      // Invalidate all related queries to ensure comprehensive data consistency
      queryClient.invalidateQueries({ queryKey: ['/api/users/career-goals/current'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: ['/api/learning-resources'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interview/roles'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/skills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/activities`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/validations`] });
      
      toast({
        title: 'Target Role Updated',
        description: `Your target role has been set to ${roleTitle}`,
      });
    } catch (error) {
      toast({
        title: 'Error Setting Target Role',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Function to clear target role
  const clearTargetRole = () => {
    setTargetRoleState(null);
  };
  
  return (
    <TargetRoleContext.Provider
      value={{
        targetRole,
        isLoading,
        error,
        setTargetRole,
        clearTargetRole,
      }}
    >
      {children}
    </TargetRoleContext.Provider>
  );
}

export function useTargetRole() {
  const context = useContext(TargetRoleContext);
  if (context === undefined) {
    throw new Error('useTargetRole must be used within a TargetRoleProvider');
  }
  return context;
}