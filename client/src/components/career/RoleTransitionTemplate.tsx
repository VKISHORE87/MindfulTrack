import React from 'react';
import { getTransitionTemplate, RoleTransitionTemplate } from '@/data/roleTransitionTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, ArrowRight, Award, Workflow } from 'lucide-react';

interface RoleTransitionTemplateProps {
  currentRole: string;
  targetRole: string;
}

export const RoleTransitionTemplateCard: React.FC<RoleTransitionTemplateProps> = ({
  currentRole,
  targetRole
}) => {
  const template = getTransitionTemplate(currentRole, targetRole);

  if (!currentRole || !targetRole) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-muted-foreground">Please select both a current role and target role to view the transition path.</p>
        </CardContent>
      </Card>
    );
  }

  if (currentRole === targetRole) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 pb-6 text-center">
          <p className="text-muted-foreground">Please select different roles for current and target positions.</p>
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card className="w-full bg-muted/20">
        <CardContent className="pt-6 pb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Custom Transition Required</h3>
            <p className="text-muted-foreground">
              No predefined transition template is available for the selected roles. 
              Our AI can generate a custom transition path based on your skills and goals.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have a template, display it
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Career Transition Plan</CardTitle>
        <CardDescription>
          Recommended path from {currentRole} to {targetRole}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transition Path */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Workflow className="text-primary h-5 w-5" />
            <h3 className="text-lg font-medium">Recommended Transition Path</h3>
          </div>
          <div className="pl-7 pr-4">
            <div className="bg-muted/40 p-4 rounded-md">
              <p className="text-md">{template.path}</p>
            </div>
          </div>
        </div>

        {/* Typical Timeframe */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="text-primary h-5 w-5" />
            <h3 className="text-lg font-medium">Typical Transition Time</h3>
          </div>
          <div className="pl-7">
            <Badge variant="outline" className="text-md px-3 py-1 border-primary/30">
              {template.time}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Key Skills to Acquire */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="text-primary h-5 w-5" />
            <h3 className="text-lg font-medium">Key Skills to Acquire</h3>
          </div>
          <div className="pl-7">
            <div className="flex flex-wrap gap-2">
              {template.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleTransitionTemplateCard;