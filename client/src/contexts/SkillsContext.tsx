import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export interface UserSkill {
  id: number;
  userId: number;
  skillId: number;
  skillName: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  notes: string | null;
  lastAssessed: string | null;
}

type SkillsContextType = {
  skills: UserSkill[] | undefined;
  isLoading: boolean;
  error: Error | null;
  updateSkillLevel: (skillId: number, currentLevel: number, targetLevel?: number) => void;
  addSkill: (skillId: number, currentLevel: number, targetLevel: number) => void;
  removeSkill: (skillId: number) => void;
  refetchSkills: () => void;
};

const SkillsContext = createContext<SkillsContextType | undefined>(undefined);

export const SkillsProvider = ({ children, userId }: { children: ReactNode; userId: number }) => {
  const { toast } = useToast();

  // Fetch user skills
  const {
    data: skills,
    isLoading,
    error,
    refetch: refetchSkills
  } = useQuery<UserSkill[], Error>({
    queryKey: [`/api/users/${userId}/skills`],
    refetchOnWindowFocus: false,
  });

  // Update skill level mutation
  const updateSkillMutation = useMutation({
    mutationFn: async ({ skillId, currentLevel, targetLevel }: { 
      skillId: number, 
      currentLevel: number, 
      targetLevel?: number 
    }) => {
      const updateData: any = { currentLevel };
      if (targetLevel !== undefined) {
        updateData.targetLevel = targetLevel;
      }

      const response = await fetch(`/api/users/${userId}/skills/${skillId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update skill level');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Skill updated',
        description: 'Your skill level has been updated successfully',
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/skills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add new skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async ({ skillId, currentLevel, targetLevel }: { 
      skillId: number, 
      currentLevel: number, 
      targetLevel: number 
    }) => {
      const response = await fetch(`/api/users/${userId}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId,
          currentLevel,
          targetLevel,
          notes: null
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add skill');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Skill added',
        description: 'New skill has been added to your profile',
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/skills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await fetch(`/api/users/${userId}/skills/${skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to remove skill');
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Skill removed',
        description: 'The skill has been removed from your profile',
      });

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/skills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Wrapper functions for mutations
  const updateSkillLevel = useCallback((skillId: number, currentLevel: number, targetLevel?: number) => {
    updateSkillMutation.mutate({ skillId, currentLevel, targetLevel });
  }, [updateSkillMutation]);

  const addSkill = useCallback((skillId: number, currentLevel: number, targetLevel: number) => {
    addSkillMutation.mutate({ skillId, currentLevel, targetLevel });
  }, [addSkillMutation]);

  const removeSkill = useCallback((skillId: number) => {
    removeSkillMutation.mutate(skillId);
  }, [removeSkillMutation]);

  return (
    <SkillsContext.Provider
      value={{
        skills,
        isLoading,
        error: error || null,
        updateSkillLevel,
        addSkill,
        removeSkill,
        refetchSkills,
      }}
    >
      {children}
    </SkillsContext.Provider>
  );
};

export const useSkills = () => {
  const context = useContext(SkillsContext);
  if (context === undefined) {
    throw new Error('useSkills must be used within a SkillsProvider');
  }
  return context;
};