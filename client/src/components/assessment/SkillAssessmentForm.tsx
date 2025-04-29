import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface SkillAssessmentProps {
  skills: Array<{
    id: number;
    name: string;
    category: string;
    description: string;
    industryStandardLevel?: number; // Required proficiency level from industry standards
  }>;
  userSkills: Array<{
    skillId: number;
    currentLevel: number;
    targetLevel: number;
  }> | null;
  userId: number;
}

export default function SkillAssessmentForm({ skills, userSkills, userId }: SkillAssessmentProps) {
  const { toast } = useToast();
  const [skillLevels, setSkillLevels] = useState<Record<number, { current: number; target: number }>>(() => {
    const initialLevels: Record<number, { current: number; target: number }> = {};
    
    // Initialize with existing user skills for current level, but always use industry standard for target level
    skills.forEach(skill => {
      const userSkill = userSkills?.find(us => us.skillId === skill.id);
      
      // Always use industry standard as target level if available, regardless of user's previous setting
      const targetLevel = skill.industryStandardLevel || 75; // Default to 75% if no industry standard
      
      initialLevels[skill.id] = {
        current: userSkill?.currentLevel || 0,
        target: targetLevel
      };
    });
    
    return initialLevels;
  });
  
  // State to track which skills are expanded for assessment
  const [expandedSkills, setExpandedSkills] = useState<Record<number, boolean>>({});
  
  const toggleSkillExpand = (skillId: number) => {
    setExpandedSkills(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }));
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCurrentLevelChange = (skillId: number, value: number[]) => {
    setSkillLevels(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        current: value[0]
      }
    }));
  };

  const handleTargetLevelChange = (skillId: number, value: number[]) => {
    setSkillLevels(prev => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        target: value[0]
      }
    }));
  };
  
  // Reset target level to industry standard
  const resetToIndustryStandard = (skillId: number) => {
    const skill = skills.find(s => s.id === skillId);
    if (skill && skill.industryStandardLevel) {
      setSkillLevels(prev => ({
        ...prev,
        [skillId]: {
          ...prev[skillId],
          target: skill.industryStandardLevel || 75
        }
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const skillPromises = Object.entries(skillLevels).map(([skillId, levels]) => {
        return apiRequest('POST', '/api/user-skills', {
          userId,
          skillId: parseInt(skillId),
          currentLevel: levels.current,
          targetLevel: levels.target,
          notes: ''
        });
      });
      
      await Promise.all(skillPromises);
      
      // Invalidate queries that depend on user skills
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/skills`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/dashboard`] });
      
      toast({
        title: "Skills updated successfully",
        description: "Your skill assessment has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error updating skills",
        description: "There was a problem saving your skill assessment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get skill proficiency description
  const getSkillLevelDescription = (level: number): string => {
    if (level < 25) return "Beginner";
    if (level < 50) return "Basic";
    if (level < 75) return "Intermediate";
    if (level < 90) return "Advanced";
    return "Expert";
  };
  
  // Get skill gap status based on current vs industry standard
  const getSkillGapStatus = (skillId: number): { status: 'missing' | 'needs_improvement' | 'proficient', color: string } => {
    const skill = skills.find(s => s.id === skillId);
    const currentLevel = skillLevels[skillId]?.current || 0;
    const industryLevel = skill?.industryStandardLevel || 75;
    
    if (currentLevel < industryLevel * 0.4) {
      return { status: 'missing', color: 'bg-red-500' };
    } else if (currentLevel < industryLevel * 0.75) {
      return { status: 'needs_improvement', color: 'bg-amber-500' };
    } else {
      return { status: 'proficient', color: 'bg-emerald-500' };
    }
  };

  // Group skills by category for better organization
  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
        <Card key={category} className="overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <h3 className="text-lg font-semibold capitalize">{category} Skills</h3>
          </CardHeader>
          <CardContent className="py-6 space-y-6">
            {categorySkills.map(skill => {
              const gapStatus = getSkillGapStatus(skill.id);
              return (
                <div key={skill.id} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleSkillExpand(skill.id)}
                  >
                    <div className="flex items-center">
                      <h4 className="font-medium text-lg">{skill.name}</h4>
                      
                      {expandedSkills[skill.id] && 
                        <p className="text-sm text-gray-500 mt-1 ml-3">{skill.description}</p>
                      }
                    </div>
                    
                    {/* Skill summary display when collapsed */}
                    {!expandedSkills[skill.id] && (
                      <div className="flex items-center space-x-4">
                        {/* Gap status indicator */}
                        <div className="flex items-center">
                          {gapStatus.status === 'missing' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                                    <span className="text-xs text-red-500">Missing</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This skill needs significant improvement to meet industry standards</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {gapStatus.status === 'needs_improvement' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                                    <span className="text-xs text-amber-500">Needs Improvement</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>This skill needs improvement to meet industry standards</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {gapStatus.status === 'proficient' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-1" />
                                    <span className="text-xs text-emerald-500">Proficient</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Your proficiency meets or exceeds industry standards</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        
                        {/* Small preview of current and target levels */}
                        <div className="text-xs text-gray-500">
                          Current: {skillLevels[skill.id]?.current}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Target: {skillLevels[skill.id]?.target}%
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="px-2 flex items-center gap-1"
                        >
                          <span>Assess</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Toggle icon when expanded */}
                    {expandedSkills[skill.id] && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="px-2"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Expanded assessment sliders */}
                  {expandedSkills[skill.id] && (
                    <div className="mt-4 space-y-6 bg-gray-50 p-4 rounded-md">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor={`current-${skill.id}`}>
                            Current Level: {skillLevels[skill.id]?.current}% 
                            <span className="ml-2 text-gray-500">
                              ({getSkillLevelDescription(skillLevels[skill.id]?.current || 0)})
                            </span>
                          </Label>
                        </div>
                        <Slider
                          id={`current-${skill.id}`}
                          min={0}
                          max={100}
                          step={5}
                          value={[skillLevels[skill.id]?.current || 0]}
                          onValueChange={(value) => handleCurrentLevelChange(skill.id, value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`target-${skill.id}`} className="flex items-center">
                            Target Level: {skillLevels[skill.id]?.target}%
                            <span className="ml-2 text-gray-500">
                              ({getSkillLevelDescription(skillLevels[skill.id]?.target || 0)})
                            </span>
                            
                            {skill.industryStandardLevel && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="ml-2 h-6 w-6 p-0"
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        resetToIndustryStandard(skill.id);
                                      }}
                                    >
                                      <Info className="h-4 w-4 text-blue-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      Industry standard for this skill is {skill.industryStandardLevel}%. 
                                      This is your recommended target proficiency level.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </Label>
                          
                          {skill.industryStandardLevel && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                resetToIndustryStandard(skill.id);
                              }}
                              className="text-xs h-7"
                            >
                              Use Recommended Level
                            </Button>
                          )}
                        </div>
                        <Slider
                          id={`target-${skill.id}`}
                          min={0}
                          max={100}
                          step={5}
                          value={[skillLevels[skill.id]?.target || (skill.industryStandardLevel || 75)]}
                          onValueChange={(value) => handleTargetLevelChange(skill.id, value)}
                        />
                        
                        {/* Show industry standard marker on the slider */}
                        {skill.industryStandardLevel && (
                          <div className="relative h-0">
                            <div 
                              className="absolute h-4 w-1 bg-blue-500 -top-10" 
                              style={{ 
                                left: `calc(${skill.industryStandardLevel}% - 2px)`,
                                marginTop: '-1px'
                              }}
                            ></div>
                            <div 
                              className="absolute text-xs text-blue-500 -top-10 transform -translate-x-1/2" 
                              style={{ 
                                left: `${skill.industryStandardLevel}%`, 
                                marginTop: '-10px' 
                              }}
                            >
                              Recommended level
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardFooter className="flex justify-end py-4">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary-700"
          >
            {isSubmitting ? "Saving..." : "Save Assessment"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
