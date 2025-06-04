import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define the UserSkill type
export interface UserSkill {
  id: number;
  userId: number;
  skillId: number;
  currentLevel: number;
  targetLevel: number;
  skill?: {
    id: number;
    name: string;
    category: string;
  };
}

// Define the shape of the skills context
interface SkillsContextType {
  userId: number;
  skills: UserSkill[] | undefined;
  isLoading: boolean;
  error: Error | null;
  updateSkillLevel: (skillId: number, currentLevel: number, targetLevel: number) => Promise<void>;
  refetchSkills: () => void;
}

// Create the context
const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

// Provider component
export function SkillsProvider({ children, userId }: { children: ReactNode; userId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for user skills
  const { data: skills, isLoading, error, refetch } = useQuery<UserSkill[]>({
    queryKey: [`/api/users/${userId}/skills`],
    staleTime: 30000,
  });

  // Mutation for updating skill levels
  const updateSkillMutation = useMutation({
    mutationFn: async ({ skillId, currentLevel, targetLevel }: { 
      skillId: number; 
      currentLevel: number; 
      targetLevel: number; 
    }) => {
      return apiRequest(`/api/users/${userId}/skills/${skillId}`, {
        method: 'PUT',
        body: {
          currentLevel,
          targetLevel
        }
      });
    },
    onSuccess: () => {
      // Invalidate and refetch skills data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/skills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      
      toast({
        title: "Success",
        description: "Skill levels updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error updating skill:', error);
      toast({
        title: "Error",
        description: "Failed to update skill levels. Please try again.",
        variant: "destructive",
      });
    }
  });

  const updateSkillLevel = async (skillId: number, currentLevel: number, targetLevel: number) => {
    await updateSkillMutation.mutateAsync({ skillId, currentLevel, targetLevel });
  };

  const value = {
    userId,
    skills,
    isLoading,
    error,
    updateSkillLevel,
    refetchSkills: refetch
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