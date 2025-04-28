import React, { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdatingTechRoles, setIsUpdatingTechRoles] = useState(false);
  const [isUpdatingOtherRoles, setIsUpdatingOtherRoles] = useState(false);
  const [lastTechUpdateResult, setLastTechUpdateResult] = useState<{
    message: string;
    count?: number;
    timestamp: Date;
  } | null>(null);
  const [lastOtherUpdateResult, setLastOtherUpdateResult] = useState<{
    message: string;
    addedCount?: number;
    deletedCount?: number;
    timestamp: Date;
  } | null>(null);

  const handleUpdateTechRoles = async () => {
    try {
      setIsUpdatingTechRoles(true);
      
      const response = await apiRequest('POST', '/api/interview/update-tech-roles');
      const data = await response.json();
      
      setLastTechUpdateResult({
        message: data.message,
        count: data.count,
        timestamp: new Date()
      });
      
      // Invalidate roles cache so the UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/interview/roles'] });
      
      toast({
        title: "Success",
        description: `${data.message} (${data.count} roles added)`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating tech roles:", error);
      toast({
        title: "Error",
        description: "Failed to update technology roles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTechRoles(false);
    }
  };
  
  const handleUpdateOtherIndustryRoles = async () => {
    try {
      setIsUpdatingOtherRoles(true);
      
      const response = await apiRequest('POST', '/api/interview/update-other-industry-roles');
      const data = await response.json();
      
      setLastOtherUpdateResult({
        message: data.message,
        addedCount: data.addedCount,
        deletedCount: data.deletedCount,
        timestamp: new Date()
      });
      
      // Invalidate roles cache so the UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/interview/roles'] });
      
      toast({
        title: "Success",
        description: `${data.message} (${data.addedCount} roles added)`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating industry roles:", error);
      toast({
        title: "Error",
        description: "Failed to update industry roles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingOtherRoles(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Admin Tools</CardTitle>
        <CardDescription>
          Special operations for platform administration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            Technology Industry Roles
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Update technology industry roles with a comprehensive categorized list including Software Development, Data & AI, Cloud & Infrastructure, and more.
          </p>
          
          <Button 
            onClick={handleUpdateTechRoles} 
            disabled={isUpdatingTechRoles}
            className="w-full sm:w-auto"
          >
            {isUpdatingTechRoles && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Technology Roles
          </Button>
          
          {lastTechUpdateResult && (
            <div className="mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {new Date(lastTechUpdateResult.timestamp).toLocaleTimeString()}
                </Badge>
                <span>{lastTechUpdateResult.message}</span>
              </div>
              {lastTechUpdateResult.count && (
                <span className="text-muted-foreground text-xs">
                  Added {lastTechUpdateResult.count} roles
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Other Industry Roles
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Update roles for multiple industries including Marketing, Finance, Healthcare, Education, Human Resources, Operations, and more.
          </p>
          
          <Button 
            onClick={handleUpdateOtherIndustryRoles} 
            disabled={isUpdatingOtherRoles}
            className="w-full sm:w-auto"
          >
            {isUpdatingOtherRoles && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Other Industry Roles
          </Button>
          
          {lastOtherUpdateResult && (
            <div className="mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {new Date(lastOtherUpdateResult.timestamp).toLocaleTimeString()}
                </Badge>
                <span>{lastOtherUpdateResult.message}</span>
              </div>
              <div className="text-muted-foreground text-xs">
                {lastOtherUpdateResult.deletedCount !== undefined && (
                  <span>Deleted {lastOtherUpdateResult.deletedCount} existing roles. </span>
                )}
                {lastOtherUpdateResult.addedCount !== undefined && (
                  <span>Added {lastOtherUpdateResult.addedCount} new roles.</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        These tools are intended for administrative use only
      </CardFooter>
    </Card>
  );
}