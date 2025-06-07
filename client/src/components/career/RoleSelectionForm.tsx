import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useCareerGoal } from '@/contexts/CareerGoalContext';
import { useTargetRole } from '@/contexts/TargetRoleContext';
import { CareerGoal } from '../../../../shared/schema';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ArrowRight, Target } from 'lucide-react';
import RoleTransitionTemplateCard from './RoleTransitionTemplate';
import { availableRoles, Role, getRoleById, getRolesByCategory } from '@/data/availableRoles';

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
  const { targetRole, setTargetRole } = useTargetRole();
  
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
  const [targetRoleId, setTargetRoleId] = useState<number | null>(null);
  const [currentRoleTitle, setCurrentRoleTitle] = useState<string>("");
  const [targetRoleTitle, setTargetRoleTitle] = useState<string>("");
  const [targetRoleSkills, setTargetRoleSkills] = useState<string[]>([]);
  const [showTemplate, setShowTemplate] = useState<boolean>(false);
  
  // Use static roles list instead of fetching from API
  const roles = availableRoles;
  const isLoadingRoles = false;
  
  // Set initial values if we have a current goal or targetRole
  useEffect(() => {
    // First check if we have a targetRole from context
    if (targetRole) {
      setTargetRoleId(targetRole.id);
      setTargetRoleTitle(targetRole.title);
      setTargetRoleSkills(targetRole.requiredSkills);
    } 
    // Otherwise use the current goal
    else if (currentGoal?.targetRoleId) {
      setTargetRoleId(currentGoal.targetRoleId);
      
      // Find the target role title
      const role = getRoleById(currentGoal.targetRoleId);
      if (role) {
        setTargetRoleTitle(role.title);
        setTargetRoleSkills(role.requiredSkills || []);
      }
    }

    // CRITICAL FIX: Also load the current role from saved data
    // Check if the current goal has a current role ID stored
    if (currentGoal?.currentRoleId) {
      setCurrentRoleId(currentGoal.currentRoleId);
      
      // Find the current role title
      const currentRole = getRoleById(currentGoal.currentRoleId);
      if (currentRole) {
        setCurrentRoleTitle(currentRole.title);
      }
    }
  }, [currentGoal, targetRole]);

  // CRITICAL FIX: Auto-show transition path when both roles are loaded from saved data
  useEffect(() => {
    if (currentRoleTitle && targetRoleTitle) {
      setShowTemplate(true);
    }
  }, [currentRoleTitle, targetRoleTitle]);
  
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
      
      // Update global target role state
      if (targetRoleId && targetRoleTitle) {
        setTargetRole(targetRoleId, targetRoleTitle, targetRoleSkills);
      }
      
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
    const role = getRoleById(roleId);
    if (role) {
      setCurrentRoleTitle(role.title);
    }
  };
  
  const handleTargetRoleChange = (value: string) => {
    const roleId = parseInt(value);
    setTargetRoleId(roleId);
    
    // Find the role title and skills
    const role = getRoleById(roleId);
    if (role) {
      setTargetRoleTitle(role.title);
      setTargetRoleSkills(role.requiredSkills || []);
    }
  };
  
  // Group roles by category
  const groupedRoles = React.useMemo(() => {
    const grouped: Record<string, Role[]> = {};
    
    // Get unique categories without using Set
    const categoriesMap: Record<string, boolean> = {};
    roles.forEach(role => {
      categoriesMap[role.category] = true;
    });
    const categories = Object.keys(categoriesMap);
    
    // Group roles by category
    categories.forEach(category => {
      grouped[category] = getRolesByCategory(category);
    });
    
    return grouped;
  }, []);
  
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
                  {Object.entries(groupedRoles).map(([category, categoryRoles]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{category}</SelectLabel>
                      {categoryRoles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Display required skills for selected role */}
              {currentRoleId && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {getRoleById(currentRoleId)?.requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-0 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
                  {Object.entries(groupedRoles).map(([category, categoryRoles]) => (
                    <SelectGroup key={category}>
                      <SelectLabel>{category}</SelectLabel>
                      {categoryRoles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Display required skills for selected role */}
              {targetRoleId && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Required Skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {getRoleById(targetRoleId)?.requiredSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="px-2 py-0 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
        <CardFooter className="flex justify-between items-center">
          {/* Current Target Role Indicator */}
          {targetRole && (
            <div className="flex items-center text-sm">
              <Target className="h-4 w-4 text-primary mr-2" />
              <span className="text-muted-foreground mr-1">Current Target:</span>
              <Badge variant="outline" className="font-medium">
                {targetRole.title}
              </Badge>
            </div>
          )}
          
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
      
      {/* Show the transition template if both roles are available */}
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