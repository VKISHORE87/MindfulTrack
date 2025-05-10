import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface ProgressStats {
  overallPercent: number;
  skills: Array<{
    skillId: number;
    skillName: string;
    completed: number;
    total: number;
    percent: number;
  }>;
  legacyProgress?: any[]; // Include legacy data for backward compatibility
}

interface CompletionData {
  rating?: number;
  feedback?: string;
  timeSpentMinutes?: number;
}

export function useUserProgress(userId: number) {
  // Get progress statistics
  const {
    data: progressStats,
    isLoading,
    error
  } = useQuery<ProgressStats>({
    queryKey: [`/api/users/${userId}/progress`],
    retry: 1
  });

  // Mark a resource as completed
  const markAsCompletedMutation = useMutation({
    mutationFn: async ({ resourceId, data }: { resourceId: number, data?: CompletionData }) => {
      const response = await fetch(`/api/users/${userId}/resources/${resourceId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data || {})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark resource as completed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate progress queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      
      // Show success toast
      toast({
        title: 'Progress updated',
        description: 'Resource marked as completed',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark resource as completed',
        variant: 'destructive'
      });
    }
  });

  // Un-mark a resource as completed
  const removeCompletionMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await fetch(`/api/users/${userId}/resources/${resourceId}/complete`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove resource completion');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate progress queries to trigger a refetch
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/progress`] });
      
      // Show success toast
      toast({
        title: 'Progress updated',
        description: 'Resource completion removed',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove resource completion',
        variant: 'destructive'
      });
    }
  });

  // Check if a resource is completed
  const isResourceCompleted = (resourceId: number): boolean => {
    if (!progressStats) return false;
    
    // If we have legacy progress data, check there first
    if (progressStats.legacyProgress && progressStats.legacyProgress.length > 0) {
      // This would depend on how your legacy progress data is structured
      const found = progressStats.legacyProgress.find(
        (item) => item.resourceId === resourceId && item.completed
      );
      if (found) return true;
    }
    
    // For our new progress tracking, we don't have direct access to the completion records
    // We'd need to add an API endpoint to get that specific information
    // For now, we'll return false, but you should extend this as needed
    return false;
  };

  return {
    progressStats,
    isLoading,
    error,
    markAsCompleted: markAsCompletedMutation.mutate,
    removeCompletion: removeCompletionMutation.mutate,
    isMarkingCompleted: markAsCompletedMutation.isPending,
    isRemovingCompletion: removeCompletionMutation.isPending,
    isResourceCompleted
  };
}