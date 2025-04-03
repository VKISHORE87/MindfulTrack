import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { BookOpen, Search, Video, FileText } from "lucide-react";

export default function Resources({ user }: { user: any }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Fetch learning resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/learning-resources'],
  });
  
  // Fetch user progress
  const { data: userProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: [`/api/users/${user.id}/progress`],
  });
  
  // Filter resources based on search and active tab
  const filteredResources = resources?.filter(resource => {
    const matchesSearch = searchTerm === "" || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || resource.resourceType === activeTab;
    
    return matchesSearch && matchesTab;
  });
  
  // Start or update progress for a resource
  const startResource = async (resourceId: number) => {
    try {
      // Check if there's existing progress
      const existingProgress = userProgress?.find(p => p.resourceId === resourceId);
      
      const progressData = {
        userId: user.id,
        resourceId,
        progress: existingProgress ? existingProgress.progress : 0,
        completed: false,
        startedAt: new Date().toISOString()
      };
      
      await apiRequest("POST", "/api/user-progress", progressData);
      
      // Invalidate user progress to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/progress`] });
      
      toast({
        title: "Resource started",
        description: "This learning resource has been added to your progress tracking.",
      });
    } catch (error) {
      toast({
        title: "Error starting resource",
        description: "There was a problem adding this resource to your progress.",
        variant: "destructive",
      });
    }
  };
  
  // Complete a resource
  const completeResource = async (resourceId: number) => {
    try {
      // Check if there's existing progress
      const existingProgress = userProgress?.find(p => p.resourceId === resourceId);
      
      const progressData = {
        userId: user.id,
        resourceId,
        progress: 100,
        completed: true,
        completedAt: new Date().toISOString()
      };
      
      await apiRequest("POST", "/api/user-progress", progressData);
      
      // Invalidate user progress to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/progress`] });
      
      toast({
        title: "Resource completed",
        description: "Congratulations on completing this learning resource!",
      });
    } catch (error) {
      toast({
        title: "Error updating progress",
        description: "There was a problem marking this resource as complete.",
        variant: "destructive",
      });
    }
  };
  
  // Get progress for a resource
  const getResourceProgress = (resourceId: number) => {
    if (!userProgress) return null;
    return userProgress.find(p => p.resourceId === resourceId);
  };
  
  // Get icon based on resource type
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'course':
      case 'video':
        return <Video className="h-6 w-6 text-blue-600" />;
      case 'workshop':
        return <BookOpen className="h-6 w-6 text-purple-600" />;
      case 'assessment':
        return <FileText className="h-6 w-6 text-green-600" />;
      default:
        return <BookOpen className="h-6 w-6 text-gray-600" />;
    }
  };
  
  // Get badge style based on resource type
  const getBadgeStyle = (resourceType: string) => {
    switch (resourceType) {
      case 'course':
      case 'video':
        return 'bg-blue-100 text-blue-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'assessment':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || isLoadingProgress) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Learning Resources</h2>
        <p className="text-gray-600">Discover curated resources to help you build your skills.</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="course">Courses</TabsTrigger>
            <TabsTrigger value="workshop">Workshops</TabsTrigger>
            <TabsTrigger value="assessment">Assessments</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {filteredResources && filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const progress = getResourceProgress(resource.id);
            const isStarted = !!progress;
            const isCompleted = progress?.completed;
            
            return (
              <Card key={resource.id} className="overflow-hidden flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex gap-4">
                    <div className={`rounded-lg h-12 w-12 flex items-center justify-center flex-shrink-0
                      ${resource.resourceType === 'course' || resource.resourceType === 'video' ? 'bg-blue-100' : ''}
                      ${resource.resourceType === 'workshop' ? 'bg-purple-100' : ''}
                      ${resource.resourceType === 'assessment' ? 'bg-green-100' : ''}
                      ${resource.resourceType !== 'course' && resource.resourceType !== 'video' && 
                         resource.resourceType !== 'workshop' && resource.resourceType !== 'assessment' ? 'bg-gray-100' : ''}
                    `}>
                      {getResourceIcon(resource.resourceType)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{resource.title}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={getBadgeStyle(resource.resourceType)}>
                          {resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500 flex items-center">
                          {resource.duration ? `${Math.round(resource.duration / 60)} hours` : '1 hour'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-600">{resource.description}</p>
                  
                  {isStarted && !isCompleted && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${progress.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="mt-4 p-2 bg-green-50 border border-green-100 rounded-md flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-green-700">Completed</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  {!isStarted ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => startResource(resource.id)}
                    >
                      Start Learning
                    </Button>
                  ) : isCompleted ? (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled
                    >
                      Completed
                    </Button>
                  ) : (
                    <div className="w-full flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => resource.url && window.open(resource.url, '_blank')}
                      >
                        Continue
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary-700"
                        onClick={() => completeResource(resource.id)}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No resources found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `No resources matching "${searchTerm}" were found. Try a different search term.` 
                : "No resources available for this category."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
