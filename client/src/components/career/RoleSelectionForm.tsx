import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCareerGoal } from '@/contexts/CareerGoalContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ArrowRight, RefreshCw } from 'lucide-react';
import RoleTransitionTemplateCard from './RoleTransitionTemplate';

interface Role {
  id: number;
  title: string;
  industry?: string;
  level?: string;
  roleType?: string;
}

interface RoleSelectionFormProps {
  userId: number;
  onRoleSelected?: (currentRoleId: number, targetRoleId: number) => void;
}

export const RoleSelectionForm: React.FC<RoleSelectionFormProps> = ({
  userId,
  onRoleSelected
}) => {
  const { toast } = useToast();
  const { currentGoal, refetchGoal } = useCareerGoal();
  
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [targetRoleId, setTargetRoleId] = useState<number | null>(null);
  const [currentRoleTitle, setCurrentRoleTitle] = useState<string>("");
  const [targetRoleTitle, setTargetRoleTitle] = useState<string>("");
  const [showTemplate, setShowTemplate] = useState<boolean>(false);
  
  // Fetch all available roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery<Role[], Error>({
    queryKey: ['/api/interview/roles'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Set initial values if we have a current goal
  useEffect(() => {
    if (currentGoal?.targetRoleId) {
      setTargetRoleId(currentGoal.targetRoleId);
      
      // Find the target role title
      if (roles) {
        const role = roles.find(r => r.id === currentGoal.targetRoleId);
        if (role) {
          setTargetRoleTitle(role.title);
        }
      }
    }
  }, [currentGoal, roles]);
  
  // Mutation to save the target role
  const saveTargetRoleMutation = useMutation({
    mutationFn: async ({ currentRoleId, targetRoleId }: { currentRoleId: number, targetRoleId: number }) => {
      return await apiRequest('POST', `/api/users/${userId}/career-goals`, {
        currentRoleId,
        targetRoleId,
        timelineMonths: 12, // Default timeline
      });
    },
    onSuccess: () => {
      refetchGoal();
      toast({
        title: 'Target Role Saved',
        description: 'Your career goal has been updated successfully.',
      });
      
      if (onRoleSelected) {
        onRoleSelected(currentRoleId!, targetRoleId!);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Saving Target Role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleSave = async () => {
    if (!currentRoleId || !targetRoleId) {
      toast({
        title: 'Selection Required',
        description: 'Please select both current and target roles',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentRoleId === targetRoleId) {
      toast({
        title: 'Invalid Selection',
        description: 'Current and target roles must be different',
        variant: 'destructive',
      });
      return;
    }
    
    await saveTargetRoleMutation.mutateAsync({ currentRoleId, targetRoleId });
    setShowTemplate(true);
  };
  
  const handleCurrentRoleChange = (value: string) => {
    const roleId = parseInt(value);
    setCurrentRoleId(roleId);
    
    // Find the role title
    if (roles) {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        setCurrentRoleTitle(role.title);
      }
    }
  };
  
  const handleTargetRoleChange = (value: string) => {
    const roleId = parseInt(value);
    setTargetRoleId(roleId);
    
    // Find the role title
    if (roles) {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        setTargetRoleTitle(role.title);
      }
    }
  };
  
  // Group roles by industry for better organization
  const groupedRoles = React.useMemo(() => {
    if (!roles) return {};
    
    const grouped: Record<string, Role[]> = {};
    roles.forEach(role => {
      const industry = role.industry || 'Other';
      if (!grouped[industry]) {
        grouped[industry] = [];
      }
      grouped[industry].push(role);
    });
    
    return grouped;
  }, [roles]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Career Transition Planning</CardTitle>
          <CardDescription>
            Select your current role and target role to see a recommended transition path
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="current-role">Current Role</Label>
              <Select
                value={currentRoleId?.toString()}
                onValueChange={handleCurrentRoleChange}
              >
                <SelectTrigger id="current-role" className="w-full">
                  <SelectValue placeholder="Select your current role" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingRoles ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading roles...</span>
                    </div>
                  ) : (
                    Object.entries(groupedRoles).map(([industry, industryRoles]) => (
                      <SelectGroup key={industry}>
                        <SelectLabel>{industry}</SelectLabel>
                        {industryRoles.map(role => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Target Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="target-role">Target Role</Label>
              <Select
                value={targetRoleId?.toString()}
                onValueChange={handleTargetRoleChange}
              >
                <SelectTrigger id="target-role" className="w-full">
                  <SelectValue placeholder="Select your target role" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingRoles ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading roles...</span>
                    </div>
                  ) : (
                    Object.entries(groupedRoles).map(([industry, industryRoles]) => (
                      <SelectGroup key={industry}>
                        <SelectLabel>{industry}</SelectLabel>
                        {industryRoles.map(role => (
                          <SelectItem key={role.id} value={role.id.toString()}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Selected Roles Summary */}
          {(currentRoleId || targetRoleId) && (
            <div className="bg-muted/30 p-4 rounded-md flex items-center justify-center space-x-4">
              {currentRoleId && (
                <Badge variant="outline" className="px-3 py-1">
                  {currentRoleTitle}
                </Badge>
              )}
              
              {currentRoleId && targetRoleId && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
              
              {targetRoleId && (
                <Badge variant="secondary" className="px-3 py-1">
                  {targetRoleTitle}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onClick={handleSave}
            disabled={saveTargetRoleMutation.isPending || !currentRoleId || !targetRoleId || currentRoleId === targetRoleId}
          >
            {saveTargetRoleMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Target Role
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Show the transition template if both roles are selected */}
      {(showTemplate || (currentRoleTitle && targetRoleTitle)) && (
        <RoleTransitionTemplateCard
          currentRole={currentRoleTitle}
          targetRole={targetRoleTitle}
        />
      )}
    </div>
  );
};

export default RoleSelectionForm;