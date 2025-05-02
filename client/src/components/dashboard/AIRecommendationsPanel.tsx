import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Sparkles, Lightbulb, BrainCog, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

interface AIRecommendationsPanelProps {
  isActive?: boolean;
}

export default function AIRecommendationsPanel({
  isActive = false
}: AIRecommendationsPanelProps) {
  const { currentGoal } = useCareerGoal();
  
  // If inactive, show a more minimal placeholder
  if (!isActive) {
    return (
      <Card className="border-primary/10 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-semibold text-lg">AI Coach</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-4">
                Get personalized recommendations and guidance from your AI career coach
              </p>
              <Button variant="outline" size="sm">
                <Link href="/dashboard?aiCoach=true">
                  <span className="flex items-center">
                    <BrainCog className="h-4 w-4 mr-2" />
                    Activate AI Coach
                  </span>
                </Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <Lightbulb className="h-16 w-16 text-primary/20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Active version with recommendations
  return (
    <Card className="border-primary/10 bg-gradient-to-r from-purple-50 to-blue-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-semibold text-lg">AI Coach</h3>
          </div>
          <div className="text-xs bg-primary/80 text-white px-2 py-1 rounded-full">
            BETA
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-white/80 rounded-lg shadow-sm">
            <div className="flex">
              <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0 self-start">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">
                  Based on your {currentGoal?.title || 'career'} journey
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {currentGoal 
                    ? `I recommend focusing on the core technical skills needed for ${currentGoal.title}.` 
                    : "I recommend setting a specific career goal to get personalized guidance."}
                </p>
                <Link href="/assessment" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
                  Take skill assessment
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white/80 rounded-lg shadow-sm">
            <div className="flex">
              <div className="bg-primary/10 p-2 rounded-full mr-3 flex-shrink-0 self-start">
                <BrainCog className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">
                  Your learning pattern analysis
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  You learn best through practical, hands-on exercises. Consider project-based learning.
                </p>
                <Link href="/resources?mode=interactive" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
                  Find interactive resources
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href="/coach" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
          Get personalized guidance
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}