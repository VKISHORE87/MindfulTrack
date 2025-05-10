import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types for skills data
export interface UserSkill {
  id: number;
  userId: number;
  skillId: number;
  skillName: string;
  description?: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  isPriority?: boolean;
  updatedAt?: string;
  createdAt?: string;
}

interface SkillsContextType {
  skills: UserSkill[] | null;
  isLoading: boolean;
  error: Error | null;
  updateSkillLevel: (skillId: number, currentLevel: number, targetLevel: number) => Promise<void>;
  addSkill: (skillId: number, initialLevel: number, targetLevel: number) => Promise<void>;
  removeSkill: (skillId: number) => Promise<void>;
  refetchSkills: () => Promise<void>;
}

export const SkillsContext = createContext<SkillsContextType | null>(null);

interface SkillsProviderProps {
  children: ReactNode;
  userId: number;
}

export const SkillsProvider: React.FC<SkillsProviderProps> = ({
  children,
  userId
}) => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<UserSkill[] | null>(null);

  // Fetch skills data
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<UserSkill[], Error>({
    queryKey: [`/api/users/${userId}/skills`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setSkills(data);
    }
  }, [data]);

  // Mutation to update skill level
  const updateSkillMutation = useMutation({
    mutationFn: async ({ skillId, currentLevel, targetLevel }: { 
      skillId: number, 
      currentLevel: number, 
      targetLevel: number 
    }) => {
      return await apiRequest('PATCH', `/api/users/${userId}/skills/${skillId}`, {
        currentLevel,
        targetLevel
      });
    },
    onSuccess: () => {
      refetch(); // Refetch skills data to update local state
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      toast({
        title: 'Skill Updated',
        description: 'Your skill level has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to add a new skill
  const addSkillMutation = useMutation({
    mutationFn: async ({ skillId, currentLevel, targetLevel }: { 
      skillId: number, 
      currentLevel: number, 
      targetLevel: number 
    }) => {
      return await apiRequest('POST', `/api/users/${userId}/skills`, {
        skillId,
        currentLevel,
        targetLevel
      });
    },
    onSuccess: () => {
      refetch(); // Refetch skills data to update local state
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      toast({
        title: 'Skill Added',
        description: 'A new skill has been added to your profile.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Adding Skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to remove a skill
  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      return await apiRequest('DELETE', `/api/users/${userId}/skills/${skillId}`);
    },
    onSuccess: () => {
      refetch(); // Refetch skills data to update local state
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      toast({
        title: 'Skill Removed',
        description: 'The skill has been removed from your profile.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Removing Skill',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update skill levels
  const updateSkillLevel = async (skillId: number, currentLevel: number, targetLevel: number) => {
    await updateSkillMutation.mutateAsync({ skillId, currentLevel, targetLevel });
  };

  // Add a new skill
  const addSkill = async (skillId: number, initialLevel: number, targetLevel: number) => {
    await addSkillMutation.mutateAsync({ 
      skillId, 
      currentLevel: initialLevel, 
      targetLevel 
    });
  };

  // Remove a skill
  const removeSkill = async (skillId: number) => {
    await removeSkillMutation.mutateAsync(skillId);
  };

  // Refetch skills data (exposed for other contexts to trigger)
  const refetchSkills = async () => {
    await refetch();
  };

  return (
    <SkillsContext.Provider
      value={{
        skills,
        isLoading,
        error,
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
  if (!context) {
    throw new Error('useSkills must be used within a SkillsProvider');
  }
  return context;
};