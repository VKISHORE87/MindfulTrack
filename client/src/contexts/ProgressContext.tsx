import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Types for progress data
export interface ProgressResource {
  id: number;
  title?: string;
  completed: boolean;
  timeSpent?: number;
  rating?: number;
  feedback?: string;
}

export interface ProgressSkill {
  skillId: number;
  skillName: string;
  completed: number;
  total: number;
  percent: number;
}

export interface ProgressStats {
  overallPercent: number;
  skills: ProgressSkill[];
  resources?: ProgressResource[];
}

interface UpdateProgressParams {
  rating?: number;
  feedback?: string;
  timeSpentMinutes?: number;
}

interface ProgressContextType {
  progressData: ProgressStats | null;
  isLoading: boolean;
  error: Error | null;
  updateProgress: (resourceId: number, params: UpdateProgressParams) => Promise<void>;
  removeProgress: (resourceId: number) => Promise<void>;
  refetchProgress: () => Promise<void>;
}

export const ProgressContext = createContext<ProgressContextType | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
  userId: number;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({
  children,
  userId
}) => {
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<ProgressStats | null>(null);

  // Fetch progress data
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery<ProgressStats, Error>({
    queryKey: [`/api/users/${userId}/progress`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setProgressData(data);
    }
  }, [data]);

  // Mutation to update progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ resourceId, params }: { resourceId: number, params: UpdateProgressParams }) => {
      return await apiRequest('POST', `/api/users/${userId}/progress/${resourceId}`, params);
    },
    onSuccess: () => {
      refetch(); // Refetch progress data to update local state
      toast({
        title: 'Progress Updated',
        description: 'Your progress has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Updating Progress',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to remove progress
  const removeProgressMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      return await apiRequest('DELETE', `/api/users/${userId}/progress/${resourceId}`);
    },
    onSuccess: () => {
      refetch(); // Refetch progress data to update local state
      toast({
        title: 'Progress Removed',
        description: 'The resource has been marked as incomplete.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Removing Progress',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update progress for a resource
  const updateProgress = async (resourceId: number, params: UpdateProgressParams) => {
    await updateProgressMutation.mutateAsync({ resourceId, params });
  };

  // Remove progress for a resource
  const removeProgress = async (resourceId: number) => {
    await removeProgressMutation.mutateAsync(resourceId);
  };

  // Refetch progress data (exposed for other contexts to trigger)
  const refetchProgress = async () => {
    await refetch();
  };

  return (
    <ProgressContext.Provider
      value={{
        progressData,
        isLoading,
        error,
        updateProgress,
        removeProgress,
        refetchProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};