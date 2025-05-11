import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { BookOpen, Search, Video, FileText, Tag, ExternalLink } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skill } from "@shared/schema";

export default function Resources({ user }: { user: any }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  
  // Fetch all skills
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json()),
  });
  
  // Fetch learning resources - passing userId to get role-specific resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/learning-resources', user?.id, selectedSkillId],
    queryFn: async () => {
      if (selectedSkillId) {
        return fetch(`/api/learning-resources/skill/${selectedSkillId}`).then(res => res.json());
      } else {
        return fetch(`/api/learning-resources?userId=${user.id}`).then(res => res.json());
      }
    },
  });
  
  // Fetch user progress directly from the API to see actual structure
  const { data: userProgress, isLoading: isLoadingProgress } = useQuery<any>({
    queryKey: [`/api/users/${user.id}/progress`],
  });
  
  // Log progress data when it changes for debugging
  useEffect(() => {
    if (userProgress) {
      console.log("[DEBUG] Resources - Progress data structure:", userProgress);
    }
  }, [userProgress]);
  
  // Filter resources based on search term only
  const filteredResources = resources?.filter(resource => {
    return searchTerm === "" || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
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
    
    // Add debug to see structure
    console.log("[DEBUG] ResourcesPage - userProgress:", userProgress);
    
    // Try different approaches based on possible structures
    // 1. Check if we have a resourceProgress array
    if (userProgress.resourceProgress && Array.isArray(userProgress.resourceProgress)) {
      return userProgress.resourceProgress.find((p: any) => p.resourceId === resourceId);
    }
    
    // 2. Check if we have a legacyProgress array
    if (userProgress.legacyProgress && Array.isArray(userProgress.legacyProgress)) {
      return userProgress.legacyProgress.find((p: any) => p.resourceId === resourceId);
    }
    
    // 3. Check if userProgress itself is an array
    if (Array.isArray(userProgress)) {
      return userProgress.find((p: any) => p.resourceId === resourceId);
    }
    
    return null;
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
      
      {/* Skills Dropdown */}
      <div className="mb-8 p-4 border rounded-lg bg-slate-50">
        <div className="flex flex-col md:flex-row items-start gap-4">
          <div className="w-full max-w-lg">
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <Tag className="mr-2 h-5 w-5 text-primary" />
              Browse by Skill
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a specific skill to view learning materials focused on that skill area
            </p>
            <Select 
              value={selectedSkillId || ""}
              onValueChange={(value) => setSelectedSkillId(value === "" ? null : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a skill to explore..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {skills?.map((skill) => (
                  <SelectItem key={skill.id} value={skill.id.toString()}>
                    {skill.name} ({skill.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedSkillId && (
              <div className="mt-4 flex items-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 p-0 h-auto"
                  onClick={() => setSelectedSkillId(null)}
                >
                  Clear selection
                </Button>
                <span className="mx-2 text-muted-foreground">|</span>
                <p className="text-sm text-muted-foreground">
                  Showing resources for: <strong>{skills?.find(s => s.id.toString() === selectedSkillId)?.name}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                  
                  {/* Provider info with link to resource */}
                  {resource.provider && (
                    <div className="mt-3 flex items-center">
                      <span className="text-xs text-blue-600 font-medium mr-2">Provider:</span>
                      <span className="text-xs text-gray-700">{resource.provider}</span>
                      {resource.url && (
                        <a 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Visit resource
                        </a>
                      )}
                    </div>
                  )}
                  
                  {/* Skills addressed by this resource */}
                  {resource.skillIds && resource.skillIds.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs text-blue-600 font-medium mb-1 block">Skills addressed:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resource.skillIds.map(skillId => {
                          const skill = skills?.find(s => s.id.toString() === skillId);
                          return skill ? (
                            <Badge 
                              key={skillId} 
                              variant="outline" 
                              className="text-xs py-0 h-5"
                            >
                              {skill.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
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
                : "No resources available."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
