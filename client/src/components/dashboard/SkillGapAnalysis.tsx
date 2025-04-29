import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SkillProgressBar from "@/components/ui/SkillProgressBar";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillGap {
  id: number;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  percentage: number;
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
      
      // Get the user's career goals
      const careerGoalsResponse = await fetch(`/api/users/${userId}/career-goals`);
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
        {skillGaps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No skill gap analysis available.</p>
            <p className="text-sm mt-2">Set a career goal and complete your skill assessment to see your gaps.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm bg-secondary/20 p-2 rounded border">
              <strong>Current Target Role:</strong> {
                targetRoleId 
                  ? `${typeof targetRoleId === 'object' 
                      ? JSON.stringify(targetRoleId) 
                      : targetRoleId}`
                  : 'Default role'
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
            <Link href="/assessment?tab=analysis">
              <a className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-800">
                View full skill gap analysis
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </Link>
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
