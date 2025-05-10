import React, { useState, useEffect } from 'react';
import { useLearningPath } from '@/contexts/LearningPathContext';
import { useCareerGoal } from '@/contexts/CareerGoalContext';
import { useProgress } from '@/contexts/ProgressContext';
import { ResourceProgressTracker } from './ResourceProgressTracker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ChevronRight, 
  ChevronDown, 
  Info, 
  Rocket, 
  MapPin, 
  CheckCircle2, 
  Clock
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LearningPathRoadmapProps {
  userId: number;
}

export const LearningPathRoadmap: React.FC<LearningPathRoadmapProps> = ({
  userId
}) => {
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  const { learningPaths, activePath, isLoading, generatePathForRole } = useLearningPath();
  const { progressData } = useProgress();
  
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Set the selected path based on active path or first available path
  useEffect(() => {
    if (activePath) {
      setSelectedPathId(activePath.id);
    } else if (learningPaths && learningPaths.length > 0) {
      setSelectedPathId(learningPaths[0].id);
    }
  }, [activePath, learningPaths]);

  // Get the currently selected path
  const selectedPath = learningPaths?.find(path => path.id === selectedPathId);

  // Calculate progress for each module
  const calculateModuleProgress = (moduleResources: any[]) => {
    if (!progressData || !moduleResources || moduleResources.length === 0) {
      return 0;
    }
    
    const completedResources = moduleResources.filter(resource => {
      // Find if this resource is marked as completed in progress data
      const resourceExists = progressData.skills
        .flatMap(skill => skill.resources || [])
        .some(progressResource => 
          progressResource && progressResource.id === resource.id && progressResource.completed
        );
      
      return resourceExists;
    });
    
    return Math.round((completedResources.length / moduleResources.length) * 100);
  };

  // Calculate overall path progress
  const calculatePathProgress = (path: any) => {
    if (!path || !path.modules || path.modules.length === 0) {
      return 0;
    }
    
    const totalResources = path.modules.reduce(
      (count: number, module: any) => count + (module.resources?.length || 0), 
      0
    );
    
    if (totalResources === 0) {
      return 0;
    }
    
    const completedResources = path.modules.reduce((count: number, module: any) => {
      const moduleCompletedResources = module.resources?.filter((resource: any) => {
        return progressData?.skills
          .flatMap(skill => skill.resources || [])
          .some(progressResource => 
            progressResource && 
            progressResource.id === resource.id && 
            progressResource.completed
          );
      })?.length || 0;
      
      return count + moduleCompletedResources;
    }, 0);
    
    return Math.round((completedResources / totalResources) * 100);
  };

  const toggleModuleExpansion = (moduleKey: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleKey) 
        ? prev.filter(key => key !== moduleKey)
        : [...prev, moduleKey]
    );
  };

  const handleGeneratePath = async () => {
    if (!currentGoal?.targetRoleId) return;
    
    setIsGenerating(true);
    try {
      await generatePathForRole(currentGoal.targetRoleId);
    } catch (error) {
      console.error('Error generating learning path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!learningPaths || learningPaths.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Learning Paths Available</CardTitle>
          <CardDescription>
            Create a learning path to track your progress toward your career goals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {currentGoal?.targetRoleId 
                ? `Generate a tailored learning path for ${currentGoal.title}` 
                : 'Set a career goal to get personalized learning path recommendations'}
            </p>
            
            {currentGoal?.targetRoleId ? (
              <Button 
                onClick={handleGeneratePath} 
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {isGenerating ? 'Generating Path...' : 'Generate Learning Path'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/career-transitions'}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Set Career Goal First
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPath) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Select a learning path to view details</p>
        </CardContent>
      </Card>
    );
  }

  const pathProgress = calculatePathProgress(selectedPath);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{selectedPath.title}</CardTitle>
              <CardDescription>
                {selectedPath.description || 'A customized learning path for your career goal'}
              </CardDescription>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Overall Progress:</span>
                <Badge variant={pathProgress >= 80 ? "success" : (pathProgress >= 40 ? "warning" : "default")}>
                  {pathProgress}%
                </Badge>
              </div>
              
              <Progress value={pathProgress} className="w-[150px] h-2">
                <ProgressIndicator style={{ transform: `translateX(-${100 - pathProgress}%)` }} />
              </Progress>
            </div>
          </div>
        </CardHeader>
        
        {learningPaths.length > 1 && (
          <CardContent className="pb-0">
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Available Learning Paths:</h3>
              <Tabs defaultValue={selectedPathId?.toString()} onValueChange={(value) => setSelectedPathId(Number(value))}>
                <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {learningPaths.map((path) => (
                    <TabsTrigger
                      key={path.id}
                      value={path.id.toString()}
                      className="relative"
                    >
                      <span className="truncate max-w-[150px]">{path.title}</span>
                      {activePath?.id === path.id && (
                        <Badge variant="outline" className="absolute -top-2 -right-2 text-[10px] py-0 h-5">
                          Current
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="space-y-4">
        {selectedPath.modules.map((module, index) => {
          const moduleKey = `module-${index}`;
          const moduleProgress = calculateModuleProgress(module.resources || []);
          
          return (
            <Card key={moduleKey} className="overflow-hidden">
              <CardHeader 
                className={`pb-3 cursor-pointer ${expandedModules.includes(moduleKey) ? 'bg-muted/50' : ''}`}
                onClick={() => toggleModuleExpansion(moduleKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Progress value={moduleProgress} className="w-[100px] h-2" />
                      <span className="text-sm font-medium">{moduleProgress}%</span>
                    </div>
                    {expandedModules.includes(moduleKey) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </div>
                
                {module.description && (
                  <CardDescription>{module.description}</CardDescription>
                )}
              </CardHeader>
              
              {expandedModules.includes(moduleKey) && (
                <CardContent className="pt-4">
                  {module.resources && module.resources.length > 0 ? (
                    <div className="space-y-4">
                      {module.resources.map((resource, resourceIndex) => (
                        <ResourceProgressTracker
                          key={`resource-${resource.id || resourceIndex}`}
                          resourceId={resource.id}
                          resourceTitle={resource.title}
                          resourceType={resource.type || 'article'}
                          isCompleted={!!resource.completed}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No resources available in this module</p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Target skills section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Required Skills for {currentGoal?.title || 'Target Role'}</CardTitle>
          <CardDescription>These are the key skills you need to develop</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {targetRoleSkills.map((skill, index) => (
              <Badge key={index} variant="outline" className="px-3 py-1">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};