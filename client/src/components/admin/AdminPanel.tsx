import React, { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminPanel() {
  const { toast } = useToast();
  const [isUpdatingTechRoles, setIsUpdatingTechRoles] = useState(false);
  const [lastUpdateResult, setLastUpdateResult] = useState<{
    message: string;
    count?: number;
    timestamp: Date;
  } | null>(null);

  const handleUpdateTechRoles = async () => {
    try {
      setIsUpdatingTechRoles(true);
      
      const response = await apiRequest('POST', '/api/interview/update-tech-roles');
      const data = await response.json();
      
      setLastUpdateResult({
        message: data.message,
        count: data.count,
        timestamp: new Date()
      });
      
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Admin Tools</CardTitle>
        <CardDescription>
          Special operations for platform administration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Career Role Management</h3>
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
          
          {lastUpdateResult && (
            <div className="mt-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {new Date(lastUpdateResult.timestamp).toLocaleTimeString()}
                </Badge>
                <span>{lastUpdateResult.message}</span>
              </div>
              {lastUpdateResult.count && (
                <span className="text-muted-foreground text-xs">
                  Added {lastUpdateResult.count} roles
                </span>
              )}
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