import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types for learning path data
export interface LearningPathResource {
  id: number;
  title: string;
  description?: string;
  type?: string;
  url?: string;
  estimatedTime?: number;
  difficulty?: string;
  completed?: boolean;
}

export interface LearningPathModule {
  id: number;
  title: string;
  description?: string;
  order: number;
  resources?: LearningPathResource[];
}

export interface LearningPath {
  id: number;
  userId: number;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  targetRoleId?: number;
  isActive?: boolean;
  modules: LearningPathModule[];
}

interface LearningPathContextType {
  learningPaths: LearningPath[] | null;
  activePath: LearningPath | null;
  isLoading: boolean;
  error: Error | null;
  setActivePath: (pathId: number) => Promise<void>;
  generatePathForRole: (roleId: number) => Promise<void>;
  refetchPaths: () => Promise<void>;
}

export const LearningPathContext = createContext<LearningPathContextType | null>(null);

interface LearningPathProviderProps {
  children: ReactNode;
  userId: number;
}

export const LearningPathProvider: React.FC<LearningPathProviderProps> = ({
  children,
  userId
}) => {
  const { toast } = useToast();
  const [learningPaths, setLearningPaths] = useState<LearningPath[] | null>(null);
  const [activePath, setActivePath] = useState<LearningPath | null>(null);

  // Fetch learning paths
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<LearningPath[], Error>({
    queryKey: [`/api/users/${userId}/learning-paths`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setLearningPaths(data);
      
      // Set the active path (first in list or one marked as active)
      const active = data.find(path => path.isActive) || data[0] || null;
      setActivePath(active);
    }
  }, [data]);

  // Mutation to set active path
  const setActivePathMutation = useMutation({
    mutationFn: async (pathId: number) => {
      return await apiRequest('PATCH', `/api/users/${userId}/learning-paths/${pathId}/activate`, {});
    },
    onSuccess: () => {
      refetch(); // Refetch learning paths to update local state
      toast({
        title: 'Learning Path Activated',
        description: 'Your active learning path has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Activating Path',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to generate a new learning path for a role
  const generatePathMutation = useMutation({
    mutationFn: async (roleId: number) => {
      return await apiRequest('POST', `/api/users/${userId}/learning-paths/generate`, {
        targetRoleId: roleId
      });
    },
    onSuccess: () => {
      refetch(); // Refetch learning paths to update local state
      toast({
        title: 'Learning Path Generated',
        description: 'A new learning path has been created based on your target role.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Generating Path',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set active learning path
  const setActivePathHandler = async (pathId: number) => {
    await setActivePathMutation.mutateAsync(pathId);
  };

  // Generate a new learning path for a role
  const generatePathForRole = async (roleId: number) => {
    await generatePathMutation.mutateAsync(roleId);
  };

  // Refetch learning paths (exposed for other contexts to trigger)
  const refetchPaths = async () => {
    await refetch();
  };

  return (
    <LearningPathContext.Provider
      value={{
        learningPaths,
        activePath,
        isLoading,
        error,
        setActivePath: setActivePathHandler,
        generatePathForRole,
        refetchPaths,
      }}
    >
      {children}
    </LearningPathContext.Provider>
  );
};

export const useLearningPath = () => {
  const context = useContext(LearningPathContext);
  if (!context) {
    throw new Error('useLearningPath must be used within a LearningPathProvider');
  }
  return context;
};