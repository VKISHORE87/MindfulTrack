import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Globe, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';

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
        
        {/* Debug section */}
        <div className="border rounded-md p-4 border-yellow-200 bg-yellow-50">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-600" />
            Role Debugging
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Check for specific roles in the database
          </p>
          
          <RoleDebugger />
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        These tools are intended for administrative use only
      </CardFooter>
    </Card>
  );
}

// Role debugger component
function RoleDebugger() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Fetch all roles
  const { data: roles, isLoading } = useQuery<any[]>({
    queryKey: ["/api/interview/roles"],
    placeholderData: [],
  });
  
  // Update search results when searchTerm changes
  useEffect(() => {
    if (!roles) return;
    
    const results = roles.filter(role => 
      role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  }, [searchTerm, roles]);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a role..."
          className="px-3 py-2 border rounded-md flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Just focus the input since search is automatic
            const input = document.querySelector('input[placeholder="Search for a role..."]') as HTMLInputElement;
            if (input) input.focus();
          }}
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="border rounded-md p-2 max-h-80 overflow-y-auto">
          <p className="text-sm mb-2">Found {searchResults.length} roles:</p>
          <div className="space-y-2">
            {searchResults.map(role => (
              <div key={role.id} className="border-b pb-2">
                <div className="font-medium">{role.title}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">ID:</span> {role.id} | 
                  <span className="font-medium"> Industry:</span> {role.industry} |
                  <span className="font-medium"> Type:</span> {role.roleType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {searchTerm && searchResults.length === 0 && (
        <div className="text-orange-600 text-sm">
          No roles found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}