import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SkillProgressBar from "@/components/ui/SkillProgressBar";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SkillGap {
  id: number;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  percentage: number;
  targetRole?: string;
}

interface SkillGapAnalysisProps {
  skillGaps: SkillGap[];
  userId?: number;
  targetRoleId?: number | string;
}

export default function SkillGapAnalysis({ skillGaps, userId = 1, targetRoleId }: SkillGapAnalysisProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  // For debugging
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');
  
  // Keep track of previous target role ID to detect changes
  const [prevTargetRoleId, setPrevTargetRoleId] = useState<number | string | undefined>(undefined);
  
  // Check if there's a mismatch between displayed skills and target role
  const [roleDataMismatch, setRoleDataMismatch] = useState<boolean>(false);
  const [displayedRole, setDisplayedRole] = useState<string | undefined>(undefined);
  
  // Define refreshData as a useCallback to prevent recreation on each render
  const refreshData = useCallback(async (showToast = true) => {
    if (isRefreshing) return;
    
    console.log(`SkillGapAnalysis: Starting refresh. Target role ID: ${targetRoleId}`);
    setIsRefreshing(true);
    setLastRefreshTime(new Date().toLocaleTimeString());
    
    try {
      if (showToast) {
        toast({
          title: "Generating new skill gap analysis",
          description: "This may take a few seconds...",
        });
      }
      
      // Log to confirm function is being called
      console.log("Debug: Refresh function called");
      
      // Get the user's career goals
      const careerGoalsResponse = await fetch(`/api/users/${userId}/career-goals`);
      if (!careerGoalsResponse.ok) {
        throw new Error(`Failed to fetch career goals: ${careerGoalsResponse.status} ${careerGoalsResponse.statusText}`);
      }
      
      const careerGoals = await careerGoalsResponse.json();
      
      if (!careerGoals || careerGoals.length === 0) {
        toast({
          title: "No career goal found",
          description: "Please set a career goal first to generate a skill gap analysis.",
          variant: "destructive",
        });
        setIsRefreshing(false);
        return;
      }
      
      // Find the career goal with the matching target role ID
      const careerGoalId = careerGoals[0].id;
      
      console.log(`SkillGapAnalysis: Calling API with params:`, {
        userId,
        careerGoalId,
        targetRoleId: targetRoleId || undefined,
        forceRefresh: true
      });
      
      try {
        // Step 1: Generate a new skill gap analysis by calling the API
        const response = await fetch("/api/ai/skill-gap-analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            careerGoalId,
            targetRoleId: targetRoleId || undefined,
            forceRefresh: true
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to generate skill gap analysis: ${response.status} ${response.statusText}`);
        }
        
        // Get the response data for debugging
        const responseData = await response.json();
        console.log("SkillGapAnalysis: Received analysis data:", responseData);
        
        // Show success message
        if (showToast) {
          toast({
            title: "API call successful",
            description: "Successfully called the skill gap analysis API."
          });
        }
      } catch (error) {
        const apiError = error as Error;
        console.error("API call error:", apiError);
        toast({
          title: "API call failed",
          description: apiError.message || "Unknown error occurred",
          variant: "destructive",
        });
        throw apiError; // Re-throw to be caught by outer try/catch
      }
      
      // Step 2: Completely clear the cache for dashboard and role data
      console.log("SkillGapAnalysis: Refreshing queries...");
      
      // First invalidate the queries to mark them as stale
      await queryClient.invalidateQueries({ 
        queryKey: [`/api/users/${userId}/dashboard`]
      });
      
      if (targetRoleId) {
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/skills/role/${targetRoleId}`]
        });
      }
      
      // Reset the query cache entirely for these endpoints
      queryClient.removeQueries({ 
        queryKey: [`/api/users/${userId}/dashboard`]
      });
      
      if (targetRoleId) {
        queryClient.removeQueries({ 
          queryKey: [`/api/skills/role/${targetRoleId}`]
        });
      }
      
      // Force refetch to get fresh data
      await queryClient.refetchQueries({ 
        queryKey: [`/api/users/${userId}/dashboard`],
        type: 'all',
        exact: false
      });
      
      console.log("SkillGapAnalysis: Queries refreshed successfully");
      
      if (showToast) {
        toast({
          title: "Analysis complete",
          description: "Your skill gap analysis has been updated for your target role"
        });
      }
    } catch (error) {
      console.error("Error refreshing skill gap data:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to generate new skill gap analysis. See console for details.",
          variant: "destructive"
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, targetRoleId, isRefreshing, toast, queryClient]);
  
  // Auto-refresh skill gaps when targetRoleId changes
  useEffect(() => {
    // Check if targetRoleId exists and has changed
    if (targetRoleId && targetRoleId !== prevTargetRoleId) {
      console.log(`SkillGapAnalysis: Target role changed from ${prevTargetRoleId} to ${targetRoleId}, triggering refresh`);
      setPrevTargetRoleId(targetRoleId);
      refreshData(false);
    }
  }, [targetRoleId, prevTargetRoleId, refreshData]);
  
  // Check for mismatch between target role ID and actual displayed skills
  useEffect(() => {
    if (skillGaps.length > 0 && skillGaps[0]?.targetRole) {
      // Get the role name from the skills data
      const actualRole = skillGaps[0].targetRole;
      setDisplayedRole(actualRole);
      
      // If targetRoleId is a string that contains a role name, compare directly
      if (typeof targetRoleId === 'string' && !Number.isInteger(Number(targetRoleId))) {
        setRoleDataMismatch(targetRoleId !== actualRole);
      } 
      // If targetRoleId is numeric, we can't directly compare, so check if data changed
      else if (prevTargetRoleId && prevTargetRoleId !== targetRoleId) {
        // Delay the mismatch check to allow for the data to refresh
        const timer = setTimeout(() => {
          // If the role data hasn't updated after a change in targetRoleId, there might be a mismatch
          setRoleDataMismatch(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [skillGaps, targetRoleId, prevTargetRoleId]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Skill Gap Analysis</h3>
            <p className="text-sm text-gray-500">
              Your current skill levels compared to target role requirements
              {lastRefreshTime && <span className="text-xs ml-1 text-muted-foreground">(Last updated: {lastRefreshTime})</span>}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {roleDataMismatch && displayedRole && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Inconsistency Detected</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>The skills displayed below are for the role "{displayedRole}" but you selected a different target role.</p>
              <Button 
                onClick={() => refreshData(true)}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Update Skills for Current Role'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {skillGaps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No skill gap analysis available.</p>
            <p className="text-sm mt-2">Set a career goal and complete your skill assessment to see your gaps.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm bg-secondary/20 p-2 rounded border">
              <strong>Current Target Role:</strong> {
                skillGaps.length > 0 && skillGaps[0]?.targetRole
                  ? skillGaps[0].targetRole
                  : (targetRoleId 
                      ? `${typeof targetRoleId === 'object' 
                          ? JSON.stringify(targetRoleId) 
                          : targetRoleId}`
                      : 'Loading...')
              }
            </div>
            <div className="space-y-3">
              {skillGaps.map((skill) => (
                <SkillProgressBar
                  key={skill.id}
                  skillName={skill.name}
                  percentage={skill.percentage}
                />
              ))}
            </div>
          </>
        )}
        
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <Button 
              variant="link" 
              onClick={() => window.location.href = "/assessment?tab=analysis"}
              className="p-0 h-auto inline-flex items-center text-sm font-medium text-primary hover:text-primary-800"
            >
              View full skill gap analysis
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            {/* Debug section */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="text-xs text-gray-400">
                Cache ID: {Date.now().toString().slice(-4)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
