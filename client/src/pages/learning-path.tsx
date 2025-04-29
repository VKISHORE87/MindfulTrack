import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import LearningPathCard from "@/components/ui/LearningPathCard";
import { BarChart2, Calendar, Target, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LearningPath({ user }: { user: any }) {
  const { toast } = useToast();
  const [mismatchDetected, setMismatchDetected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Fetch learning paths
  const { 
    data: learningPaths, 
    isLoading: isLoadingPaths,
    refetch: refetchLearningPaths 
  } = useQuery({
    queryKey: [`/api/users/${user.id}/learning-paths`],
  });
  
  // Fetch learning resources
  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ['/api/learning-resources'],
  });
  
  // Fetch current career goal
  const { data: currentCareerGoal, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['/api/users/career-goals/current'],
  });
  
  const generateNewLearningPath = async () => {
    if (!currentCareerGoal) {
      toast({
        title: "No career goal set",
        description: "Please set a career goal first to generate a learning path.",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent multiple generations
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      // Force a dashboard query refresh to ensure we have the latest career goal data
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/dashboard`] });
      
      console.log("[DEBUG] Learning path - Generating path for career goal:", {
        id: currentCareerGoal.id,
        title: currentCareerGoal.title,
        targetRoleId: currentCareerGoal.targetRoleId
      });
      
      await apiRequest("POST", "/api/ai/generate-learning-path", {
        userId: user.id,
        careerGoalId: currentCareerGoal.id,
      });
      
      // Invalidate learning paths to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/learning-paths`] });
      
      toast({
        title: "Learning path generated",
        description: `New personalized learning path for ${currentCareerGoal.title} has been created.`,
      });
      
      // Reset mismatch state since we've generated a new path
      setMismatchDetected(false);
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was a problem generating your learning path.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Effect to detect and fix mismatches between career goal and learning path
  useEffect(() => {
    if (!isLoadingPaths && !isLoadingGoals && learningPaths?.length > 0 && currentCareerGoal && !isGenerating) {
      const currentPath = learningPaths[0];
      
      // Check if learning path title contains the current career goal or has the same target role ID
      const titleMatches = currentPath.title.includes(currentCareerGoal.title);
      const roleIdMatches = currentPath.targetRoleId === currentCareerGoal.targetRoleId;
      const pathMatchesGoal = titleMatches || roleIdMatches;
      
      console.log("[DEBUG] Learning path sync check:", {
        pathTitle: currentPath.title,
        goalTitle: currentCareerGoal.title,
        titleMatches,
        pathRoleId: currentPath.targetRoleId,
        goalRoleId: currentCareerGoal.targetRoleId,
        roleIdMatches,
        pathMatchesGoal
      });
      
      setMismatchDetected(!pathMatchesGoal);
      
      // Auto-generate new learning path if there's a mismatch
      if (!pathMatchesGoal) {
        console.log("[INFO] Auto-generating new learning path for current career goal:", currentCareerGoal.title);
        generateNewLearningPath();
      }
    }
  }, [learningPaths, currentCareerGoal, isLoadingPaths, isLoadingGoals, isGenerating]);
  
  const isLoading = isLoadingPaths || isLoadingResources || isLoadingGoals;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const primaryPath = learningPaths && learningPaths.length > 0 ? learningPaths[0] : null;

  // Function to handle synchronization of learning path with career goal
  const handleSyncLearningPath = () => {
    refetchLearningPaths();
    
    // Inform user of the refresh action
    toast({
      title: "Refreshing learning path",
      description: "Updating learning path to match your current career goal",
    });
    
    // Reset mismatch state
    setMismatchDetected(false);
  };

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Learning Path</h2>
        <p className="text-gray-600">Your personalized learning journey based on your skills and career goals.</p>
      </div>
      
      {mismatchDetected && primaryPath && currentCareerGoal && (
        <Alert className="mb-6 border-amber-500 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertTitle className="text-amber-700">Learning Path Mismatch Detected</AlertTitle>
          <AlertDescription className="space-y-2">
            <p className="text-amber-700">
              Your learning path is for a different role than your current career goal.
            </p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="font-medium">Current Path:</span> {primaryPath.title}
                <br />
                <span className="font-medium">Current Goal:</span> {currentCareerGoal.title}
              </div>
              <Button 
                variant="outline" 
                className="border-amber-500 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                onClick={handleSyncLearningPath}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Learning Path
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {primaryPath ? (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <BarChart2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{primaryPath.title}</h3>
                <p className="text-sm text-gray-500">{primaryPath.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={generateNewLearningPath}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : currentCareerGoal ? 
                     `Generate Path for ${currentCareerGoal.title}` : 
                     "Regenerate Path"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-primary-100 text-primary mr-4">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-base font-medium">
                    {new Date(primaryPath.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-amber-100 text-amber-500 mr-4">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Role</p>
                  <p className="text-base font-medium">
                    {currentCareerGoal 
                      ? currentCareerGoal.title 
                      : "No goal set"}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Modules</p>
                  <p className="text-base font-medium">
                    {primaryPath.modules.length}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center">
                <div className="p-3 rounded-full bg-emerald-100 text-emerald-500 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Est. Duration</p>
                  <p className="text-base font-medium">
                    {primaryPath.modules.reduce((total, module) => total + module.estimatedHours, 0)} hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Learning Modules</h3>
            </CardHeader>
            <CardContent>
              {primaryPath.modules.map((module, index) => (
                <LearningPathCard
                  key={module.id}
                  moduleNumber={index + 1}
                  title={module.title}
                  estimatedHours={module.estimatedHours}
                  description={module.description}
                  resources={module.resources}
                  allResources={resources || []}
                />
              ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="bg-primary/10 p-4 rounded-full mx-auto w-fit mb-4">
              <BarChart2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Learning Path Found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              You don't have a personalized learning path yet. Generate one based on your skill assessment and career goals.
            </p>
            <Button 
              className="bg-primary hover:bg-primary-700"
              onClick={generateNewLearningPath}
              disabled={!currentCareerGoal || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Learning Path...
                </>
              ) : "Generate Learning Path"}
            </Button>
            {!currentCareerGoal && (
              <p className="text-amber-500 text-sm mt-4">
                You need to set a career goal first before generating a learning path.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
