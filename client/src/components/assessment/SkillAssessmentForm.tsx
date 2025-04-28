import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SkillAssessmentProps {
  skills: Array<{
    id: number;
    name: string;
    category: string;
    description: string;
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
    
    // Initialize with existing user skills or defaults
    skills.forEach(skill => {
      const userSkill = userSkills?.find(us => us.skillId === skill.id);
      initialLevels[skill.id] = {
        current: userSkill?.currentLevel || 0,
        target: userSkill?.targetLevel || 80
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
            {categorySkills.map(skill => (
              <div key={skill.id} className="space-y-4 border-b pb-4 last:border-b-0 last:pb-0">
                <div 
                  className="flex justify-between items-center cursor-pointer" 
                  onClick={() => toggleSkillExpand(skill.id)}
                >
                  <div>
                    <h4 className="font-medium text-lg">{skill.name}</h4>
                    {expandedSkills[skill.id] && 
                      <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                    }
                  </div>
                  
                  {/* Skill summary display when collapsed */}
                  {!expandedSkills[skill.id] && (
                    <div className="flex items-center space-x-4">
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
                        <Label htmlFor={`current-${skill.id}`}>Current Level: {skillLevels[skill.id]?.current}%</Label>
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
                      <div className="flex justify-between">
                        <Label htmlFor={`target-${skill.id}`}>Target Level: {skillLevels[skill.id]?.target}%</Label>
                      </div>
                      <Slider
                        id={`target-${skill.id}`}
                        min={0}
                        max={100}
                        step={5}
                        value={[skillLevels[skill.id]?.target || 80]}
                        onValueChange={(value) => handleTargetLevelChange(skill.id, value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
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
