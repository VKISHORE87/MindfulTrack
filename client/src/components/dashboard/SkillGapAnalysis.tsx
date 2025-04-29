import { Card, CardContent, CardHeader } from "@/components/ui/card";
import SkillProgressBar from "@/components/ui/SkillProgressBar";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
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
  
  // Auto-refresh skill gaps when targetRoleId changes
  useEffect(() => {
    if (targetRoleId) {
      refreshData(false);
    }
  }, [targetRoleId]);

  const refreshData = async (showToast = true) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      if (showToast) {
        toast({
          title: "Refreshing skill data",
          description: "Getting the latest skill gap analysis...",
        });
      }
      
      // Refresh all relevant data
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: [`/api/users/${userId}/dashboard`],
          type: 'active' 
        }),
        targetRoleId ? 
          queryClient.refetchQueries({ 
            queryKey: [`/api/skills/role/${targetRoleId}`],
            type: 'active'
          }) : 
          Promise.resolve()
      ]);
      
      if (showToast) {
        toast({
          title: "Data refreshed",
          description: "Skill gap analysis is now up-to-date"
        });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to refresh skill data",
          variant: "destructive"
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Skill Gap Analysis</h3>
            <p className="text-sm text-gray-500">Your current skill levels compared to target role requirements</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={() => refreshData()}
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
          skillGaps.map((skill) => (
            <SkillProgressBar
              key={skill.id}
              skillName={skill.name}
              percentage={skill.percentage}
            />
          ))
        )}
        
        <div className="mt-6">
          <Link href="/assessment?tab=analysis">
            <a className="inline-flex items-center text-sm font-medium text-primary hover:text-primary-800">
              View full skill gap analysis
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
