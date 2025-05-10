import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

import { ProgressStats } from '@/hooks/useUserProgress';

type ProgressContextType = {
  progressData: ProgressStats | undefined;
  isLoading: boolean;
  error: Error | null;
  updateProgress: (resourceId: number, data?: {
    rating?: number;
    feedback?: string;
    timeSpentMinutes?: number;
  }) => void;
  removeProgress: (resourceId: number) => void;
  refetchProgress: () => void;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider = ({ children, userId }: { children: ReactNode; userId: number }) => {
  const { toast } = useToast();

  // Fetch progress data
  const {
    data: progressData,
    isLoading,
    error,
    refetch: refetchProgress
  } = useQuery<ProgressStats, Error>({
    queryKey: [`/api/users/${userId}/progress`],
    refetchOnWindowFocus: false,
  });

  // Mark resource as completed mutation
  const markAsCompletedMutation = useMutation({
    mutationFn: async ({ resourceId, data }: { resourceId: number, data?: { rating?: number, feedback?: string, timeSpentMinutes?: number } }) => {
      const response = await fetch(`/api/users/${userId}/progress/${resourceId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to mark resource as completed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Progress updated',
        description: 'Your progress has been updated successfully',
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update progress',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove completion mutation
  const removeCompletionMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await fetch(`/api/users/${userId}/progress/${resourceId}/remove`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to remove progress');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Progress removed',
        description: 'The resource has been marked as incomplete',
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/learning-paths`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove progress',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Wrapper functions for the mutations
  const updateProgress = useCallback((resourceId: number, data?: { rating?: number, feedback?: string, timeSpentMinutes?: number }) => {
    markAsCompletedMutation.mutate({ resourceId, data });
  }, [markAsCompletedMutation]);

  const removeProgress = useCallback((resourceId: number) => {
    removeCompletionMutation.mutate(resourceId);
  }, [removeCompletionMutation]);

  return (
    <ProgressContext.Provider
      value={{
        progressData,
        isLoading,
        error: error || null,
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
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};