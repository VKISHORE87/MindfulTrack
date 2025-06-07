import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, MapPin, MoveRight, Zap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getRoleByTitle } from '@/data/availableRoles';

interface RoleTransitionTemplateCardProps {
  currentRole: string;
  targetRole: string;
}

interface TransitionPath {
  steps: Array<{
    title: string;
    description: string;
    duration: string;
    skills: string[];
  }>;
  totalDuration: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Very Hard';
}

const RoleTransitionTemplateCard: React.FC<RoleTransitionTemplateCardProps> = ({
  currentRole,
  targetRole
}) => {
  const [transitionPath, setTransitionPath] = useState<TransitionPath | null>(null);
  
  // Get skills needed for the transition
  const currentRoleData = getRoleByTitle(currentRole);
  const targetRoleData = getRoleByTitle(targetRole);
  
  // Generate required skills comparison
  const currentSkills = currentRoleData?.requiredSkills || [];
  const targetSkills = targetRoleData?.requiredSkills || [];
  
  // Find new skills needed
  const newSkillsNeeded = targetSkills.filter(skill => !currentSkills.includes(skill));
  
  // Find shared skills
  const sharedSkills = targetSkills.filter(skill => currentSkills.includes(skill));
  
  // Calculate skill gap percentage
  const skillGapPercentage = Math.round((sharedSkills.length / targetSkills.length) * 100);
  
  // Generate a difficulty rating based on the skill gap
  const getDifficulty = (): 'Easy' | 'Moderate' | 'Hard' | 'Very Hard' => {
    if (skillGapPercentage >= 80) return 'Easy';
    if (skillGapPercentage >= 60) return 'Moderate';
    if (skillGapPercentage >= 40) return 'Hard';
    return 'Very Hard';
  };
  
  // Generate a transition path based on the two roles
  useEffect(() => {
    if (!currentRole || !targetRole) return;
    
    // Generate intermediate steps based on skill gap
    const intermediateSteps = [];
    const difficultyRating = getDifficulty(); // Store in a local variable
    
    // Create intermediate steps based on the skills gap
    if (difficultyRating === 'Easy') {
      intermediateSteps.push({
        title: 'Skill Enhancement',
        description: `Build on your existing skills and acquire the few additional skills needed for the ${targetRole} position.`,
        duration: '3-6 months',
        skills: newSkillsNeeded
      });
    } else if (difficultyRating === 'Moderate') {
      intermediateSteps.push({
        title: 'Skill Development',
        description: `Strengthen your existing skills and acquire the additional competencies needed for the ${targetRole} role.`,
        duration: '6-9 months',
        skills: newSkillsNeeded.slice(0, Math.ceil(newSkillsNeeded.length / 2))
      });
      
      intermediateSteps.push({
        title: 'Practical Experience',
        description: `Apply your skills in real-world scenarios and gain hands-on experience with the technologies and methodologies used in ${targetRole} roles.`,
        duration: '3-6 months',
        skills: newSkillsNeeded.slice(Math.ceil(newSkillsNeeded.length / 2))
      });
    } else {
      // Hard and Very Hard transitions
      const skillsPerStep = Math.ceil(newSkillsNeeded.length / 3);
      
      intermediateSteps.push({
        title: 'Foundation Building',
        description: `Develop the fundamental skills and knowledge needed for a transition to ${targetRole}.`,
        duration: '3-6 months',
        skills: newSkillsNeeded.slice(0, skillsPerStep)
      });
      
      intermediateSteps.push({
        title: 'Advanced Skill Development',
        description: `Deepen your expertise in core technologies and methodologies used in ${targetRole} positions.`,
        duration: '6-9 months',
        skills: newSkillsNeeded.slice(skillsPerStep, skillsPerStep * 2)
      });
      
      intermediateSteps.push({
        title: 'Specialization',
        description: `Master specialized skills and gain relevant experience needed for ${targetRole} roles.`,
        duration: '6-12 months',
        skills: newSkillsNeeded.slice(skillsPerStep * 2)
      });
    }
    
    // Calculate total duration based on the steps
    const calculateTotalDuration = (steps: any[]): string => {
      let minMonths = 0;
      let maxMonths = 0;
      
      steps.forEach(step => {
        const [min, max] = step.duration.split('-').map((n: string) => parseInt(n.replace(/[^0-9]/g, '')));
        minMonths += min;
        maxMonths += max;
      });
      
      return `${minMonths}-${maxMonths} months`;
    };
    
    // Generate the transition path
    setTransitionPath({
      steps: intermediateSteps,
      totalDuration: calculateTotalDuration(intermediateSteps),
      difficulty: difficultyRating
    });
    
  }, [currentRole, targetRole, newSkillsNeeded, sharedSkills.length, targetSkills.length]);
  
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500';
      case 'Moderate': return 'bg-yellow-500';
      case 'Hard': return 'bg-orange-500';
      case 'Very Hard': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };
  
  if (!transitionPath) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Transition Path: {currentRole} to {targetRole}</span>
          <Badge className={`${getDifficultyColor(transitionPath.difficulty)} text-white`}>
            {transitionPath.difficulty}
          </Badge>
        </CardTitle>
        <CardDescription>
          Estimated time: {transitionPath.totalDuration} | Skill similarity: {skillGapPercentage}%
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Skill Overlap Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Skill Gap</span>
            <span>{skillGapPercentage}% overlap</span>
          </div>
          <Progress value={skillGapPercentage} className="h-2" />
        </div>
        
        {/* Shared Skills */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Shared Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {sharedSkills.length > 0 ? (
              sharedSkills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No shared skills found</p>
            )}
          </div>
        </div>
        
        {/* New Skills Needed */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            New Skills Needed
          </h4>
          <div className="flex flex-wrap gap-2">
            {newSkillsNeeded.length > 0 ? (
              newSkillsNeeded.map((skill, index) => (
                <Badge key={index} variant="outline">
                  {skill}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No new skills needed</p>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Transition Steps */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Recommended Transition Path</h3>
          
          <div className="relative">
            {/* Start Point */}
            <div className="flex items-center mb-6">
              <Avatar className="h-10 w-10 bg-primary/10 border-2 border-primary">
                <AvatarFallback className="text-primary">{currentRole.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <p className="text-sm font-medium">{currentRole}</p>
                <p className="text-xs text-muted-foreground">Starting Point</p>
              </div>
            </div>
            
            {/* Timeline Line */}
            <div className="absolute left-5 top-10 bottom-10 w-[1px] bg-border -translate-x-1/2 z-0"></div>
            
            {/* Steps */}
            {transitionPath.steps.map((step, index) => (
              <div key={index} className="relative pl-12 pb-8">
                <div className="absolute left-[20px] top-0 h-6 w-6 rounded-full bg-muted border-2 border-primary -translate-x-1/2 z-10"></div>
                <div className="mb-1 font-medium flex items-center gap-2">
                  <span>{step.title}</span>
                  <Badge variant="outline" className="ml-2 font-normal">
                    <Clock className="mr-1 h-3 w-3" /> {step.duration}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {step.skills.map((skill, skillIndex) => (
                    <Badge key={skillIndex} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            
            {/* End Point */}
            <div className="flex items-center">
              <Avatar className="h-10 w-10 bg-primary/20 border-2 border-primary">
                <AvatarFallback className="text-primary">{targetRole.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <p className="text-sm font-medium">{targetRole}</p>
                <p className="text-xs text-muted-foreground">Target Position</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleTransitionTemplateCard;