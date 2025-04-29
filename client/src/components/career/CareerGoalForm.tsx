import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { InterviewRole } from '@shared/schema';

// Validation schema
const formSchema = z.object({
  timeline: z.string().min(1, { message: 'Please select a timeline' }),
  targetRoleId: z.string().min(1, { message: 'Please select a target role' }),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CareerGoalFormProps {
  existingGoal?: {
    id: number;
    title: string;
    timeline?: string;
    timelineMonths?: number;
    readiness: number;
    targetRoleId?: string;
    description?: string;
  };
  onSuccess?: () => void;
}

export default function CareerGoalForm({ existingGoal, onSuccess }: CareerGoalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all roles for the select input
  const { data: roles, isLoading: rolesLoading } = useQuery<InterviewRole[]>({
    queryKey: ['/api/interview/roles'],
    placeholderData: [],
  });

  // Helper function to convert months to display format
  const convertMonthsToTimeline = (months: number): string => {
    if (months < 12) {
      return `${months} months`;
    } else if (months % 12 === 0) {
      const years = months / 12;
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${months} months`;
    }
  };

  // Get timelineMonths from existingGoal if it exists
  const timelineDisplay = existingGoal?.timelineMonths 
    ? convertMonthsToTimeline(existingGoal.timelineMonths)
    : existingGoal?.timeline || '';

  // Create form instance
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timeline: timelineDisplay,
      targetRoleId: existingGoal?.targetRoleId || '',
      description: existingGoal?.description || '',
    },
  });

  // Helper function to convert string timeline to months
  const convertTimelineToMonths = (timeline: string): number => {
    if (timeline.includes('months')) {
      return parseInt(timeline.split(' ')[0]);
    } else if (timeline.includes('year')) {
      const years = parseInt(timeline.split(' ')[0]);
      return years * 12;
    }
    // Default to 12 months if format is unknown
    return 12;
  };

  // Create or update career goal
  // Add location hook to handle navigation
  const [, navigate] = useLocation();
  
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const endpoint = existingGoal 
        ? `/api/users/career-goals/${existingGoal.id}` 
        : '/api/users/career-goals';
      
      const method = existingGoal ? 'PATCH' : 'POST';
      
      // Find the selected role to use its title
      const selectedRole = roles?.find(role => role.id.toString() === data.targetRoleId);
      
      // Convert timeline string to months for API
      const processedData = {
        ...data,
        // Use the selected role title as the career goal title
        title: selectedRole?.title || 'Career Goal',
        timelineMonths: convertTimelineToMonths(data.timeline)
      };
      
      const res = await apiRequest(method, endpoint, processedData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to save career goal');
      }
      
      return res.json();
    },
    onSuccess: async (data) => {
      toast({
        title: existingGoal ? 'Career goal updated' : 'Career goal created',
        description: existingGoal 
          ? 'Your career goal has been successfully updated' 
          : 'Your career goal has been successfully created',
      });
      
      // Invalidate and immediately refresh all relevant data
      try {
        // Step 1: Refresh the user's career goals
        await queryClient.refetchQueries({ 
          queryKey: [`/api/users/${user.id}/career-goals`],
          type: 'active',
          exact: false
        });
        
        // Step 2: If we have a target role, refresh the role-specific skills
        const targetRoleId = form.getValues().targetRoleId;
        if (targetRoleId) {
          await queryClient.refetchQueries({ 
            queryKey: [`/api/skills/role/${targetRoleId}`],
            type: 'active',
            exact: false
          });
        } else {
          // Otherwise refresh all skills
          await queryClient.refetchQueries({ 
            queryKey: ['/api/skills'],
            type: 'active'
          });
        }
        
        // Step 3: Force a hard refresh of the dashboard data to reflect skill gaps
        await queryClient.refetchQueries({ 
          queryKey: [`/api/users/${user.id}/dashboard`],
          type: 'active',
          exact: false
        });
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
      
      // Navigate to dashboard after successful save
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save career goal',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="targetRoleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your target role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rolesLoading ? (
                        <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                      ) : (
                        roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title} 
                            {Array.isArray(role.requiredSkills) && role.requiredSkills.length ? 
                              ' ✓' : 
                              ' ⚠️'
                            }
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The role you want to progress to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Timeline</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="3 months">3 months</SelectItem>
                      <SelectItem value="6 months">6 months</SelectItem>
                      <SelectItem value="1 year">1 year</SelectItem>
                      <SelectItem value="2 years">2 years</SelectItem>
                      <SelectItem value="5 years">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    When you aim to achieve this goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any details about your career goal..." 
                    {...field} 
                    rows={4}
                  />
                </FormControl>
                <FormDescription>
                  Add any additional context or notes for your goal
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> 
                  Save Career Goal
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}