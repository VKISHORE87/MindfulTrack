import React, { useState, useEffect } from 'react';
import { useSkills, UserSkill } from '@/contexts/SkillsContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Save, Check, X } from 'lucide-react';

interface SkillEditorProps {
  skillId: number;
  selectedSkill?: UserSkill;
  onSkillUpdate?: () => void;
}

export const SkillEditorComponent: React.FC<SkillEditorProps> = ({
  skillId,
  selectedSkill,
  onSkillUpdate
}) => {
  const { updateSkillLevel, skills, isLoading } = useSkills();
  const { refetchProgress } = useProgress();
  
  // Initialize state with the selected skill or find it from the context
  const [skill, setSkill] = useState<UserSkill | undefined>(
    selectedSkill || skills?.find(s => s.skillId === skillId)
  );
  
  const [currentLevel, setCurrentLevel] = useState<number>(skill?.currentLevel || 1);
  const [targetLevel, setTargetLevel] = useState<number>(skill?.targetLevel || 5);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  // Update local state when the skills context or selectedSkill changes
  useEffect(() => {
    const foundSkill = selectedSkill || skills?.find(s => s.skillId === skillId);
    if (foundSkill) {
      setSkill(foundSkill);
      setCurrentLevel(foundSkill.currentLevel);
      setTargetLevel(foundSkill.targetLevel);
    }
  }, [selectedSkill, skills, skillId]);

  const handleSave = async () => {
    if (!skill) return;
    
    setIsSaving(true);
    try {
      await updateSkillLevel(skill.skillId, currentLevel, targetLevel);
      
      // After updating, refetch progress data to maintain consistency
      refetchProgress();
      
      setSavedSuccessfully(true);
      
      // Reset success indicator after 3 seconds
      setTimeout(() => {
        setSavedSuccessfully(false);
      }, 3000);
      
      // Notify parent component if callback provided
      if (onSkillUpdate) {
        onSkillUpdate();
      }
    } catch (error) {
      console.error('Error updating skill:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCurrentLevelChange = (value: number[]) => {
    setCurrentLevel(value[0]);
  };

  const handleTargetLevelChange = (value: number[]) => {
    setTargetLevel(value[0]);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!skill) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Skill not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{skill.skillName}</CardTitle>
            <CardDescription>Update your proficiency level</CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">{skill.category}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="current-level">Current Proficiency Level</Label>
            <span className="text-sm font-medium">{currentLevel}/5</span>
          </div>
          <Slider
            id="current-level"
            min={1}
            max={5}
            step={1}
            defaultValue={[currentLevel]}
            value={[currentLevel]}
            onValueChange={handleCurrentLevelChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Expert</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="target-level">Target Proficiency Level</Label>
            <span className="text-sm font-medium">{targetLevel}/5</span>
          </div>
          <Slider
            id="target-level"
            min={1}
            max={5}
            step={1}
            defaultValue={[targetLevel]}
            value={[targetLevel]}
            onValueChange={handleTargetLevelChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Beginner</span>
            <span>Intermediate</span>
            <span>Expert</span>
          </div>
        </div>

        {/* Optional numeric input for precise control */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current-level-input">Current Level (1-5)</Label>
            <Input
              id="current-level-input"
              type="number"
              min={1}
              max={5}
              value={currentLevel}
              onChange={(e) => setCurrentLevel(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-level-input">Target Level (1-5)</Label>
            <Input
              id="target-level-input"
              type="number"
              min={1}
              max={5}
              value={targetLevel}
              onChange={(e) => setTargetLevel(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <p className="text-sm text-muted-foreground">
          {isSaving ? 'Saving changes...' : savedSuccessfully ? 'Changes saved!' : 'Adjust sliders to update your skill levels'}
        </p>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || (currentLevel === skill.currentLevel && targetLevel === skill.targetLevel)}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : savedSuccessfully ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : savedSuccessfully ? 'Saved!' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};