import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useCareerGoal } from './CareerGoalContext';

export interface LearningPath {
  id: number;
  title: string;
  description: string | null;
  userId: number;
  modules: {
    title: string;
    description?: string;
    resources: {
      id: number;
      title: string;
      description?: string;
      type: string;
      completed?: boolean;
      url?: string;
      skillId?: number;
    }[];
  }[];
  createdAt: string | null;
}

type LearningPathContextType = {
  learningPaths: LearningPath[] | undefined;
  activePath: LearningPath | undefined;
  isLoading: boolean;
  error: Error | null;
  createLearningPath: (pathData: { title: string, description?: string }) => void;
  updateLearningPath: (pathId: number, pathData: { title?: string, description?: string, modules?: any }) => void;
  deleteLearningPath: (pathId: number) => void;
  setActivePath: (pathId: number) => void;
  generatePathForRole: (targetRoleId: number) => void;
};

const LearningPathContext = createContext<LearningPathContextType | undefined>(undefined);

export const LearningPathProvider = ({ children, userId }: { children: ReactNode; userId: number }) => {
  const { toast } = useToast();
  const { currentGoal } = useCareerGoal();

  // Fetch learning paths
  const {
    data: learningPaths,
    isLoading,
    error,
    refetch: refetchPaths
  } = useQuery<LearningPath[], Error>({
    queryKey: [`/api/users/${userId}/learning-paths`],
    refetchOnWindowFocus: false,
  });

  // Create learning path mutation
  const createPathMutation = useMutation({
    mutationFn: async (pathData: { title: string, description?: string }) => {
      const response = await fetch(`/api/users/${userId}/learning-paths`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pathData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create learning path');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Learning path created',
        description: 'Your new learning path has been created successfully',
      });

      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create learning path',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update learning path mutation
  const updatePathMutation = useMutation({
    mutationFn: async ({ pathId, pathData }: { 
      pathId: number, 
      pathData: { title?: string, description?: string, modules?: any } 
    }) => {
      const response = await fetch(`/api/users/${userId}/learning-paths/${pathId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pathData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update learning path');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Learning path updated',
        description: 'Your learning path has been updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update learning path',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete learning path mutation
  const deletePathMutation = useMutation({
    mutationFn: async (pathId: number) => {
      const response = await fetch(`/api/users/${userId}/learning-paths/${pathId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete learning path');
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Learning path deleted',
        description: 'The learning path has been deleted successfully',
      });

      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete learning path',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate learning path for target role mutation
  const generatePathMutation = useMutation({
    mutationFn: async (targetRoleId: number) => {
      const response = await fetch(`/api/users/${userId}/learning-paths/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetRoleId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate learning path');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Learning path generated',
        description: 'A new learning path has been created for your target role',
      });

      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });

      // After generating, set the new path as active
      if (data && data.id) {
        refetchPaths();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to generate learning path',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Find active path based on current career goal
  const activePath = currentGoal && learningPaths ? 
    learningPaths.find(path => 
      path.title.includes(currentGoal.title) || 
      (currentGoal.targetRoleId && path.title.includes(`Role ${currentGoal.targetRoleId}`))
    ) : 
    undefined;

  // Wrapper functions for mutations
  const createLearningPath = useCallback((pathData: { title: string, description?: string }) => {
    createPathMutation.mutate(pathData);
  }, [createPathMutation]);

  const updateLearningPath = useCallback((pathId: number, pathData: { title?: string, description?: string, modules?: any }) => {
    updatePathMutation.mutate({ pathId, pathData });
  }, [updatePathMutation]);

  const deleteLearningPath = useCallback((pathId: number) => {
    deletePathMutation.mutate(pathId);
  }, [deletePathMutation]);

  const setActivePath = useCallback((pathId: number) => {
    // This is a client-side action only, it doesn't need an API call
    // In a real implementation, we might want to persist this preference
    console.log(`[DEBUG] Setting active path: ${pathId}`);
  }, []);

  const generatePathForRole = useCallback((targetRoleId: number) => {
    generatePathMutation.mutate(targetRoleId);
  }, [generatePathMutation]);

  return (
    <LearningPathContext.Provider
      value={{
        learningPaths,
        activePath,
        isLoading,
        error: error || null,
        createLearningPath,
        updateLearningPath,
        deleteLearningPath,
        setActivePath,
        generatePathForRole,
      }}
    >
      {children}
    </LearningPathContext.Provider>
  );
};

export const useLearningPath = () => {
  const context = useContext(LearningPathContext);
  if (context === undefined) {
    throw new Error('useLearningPath must be used within a LearningPathProvider');
  }
  return context;
};