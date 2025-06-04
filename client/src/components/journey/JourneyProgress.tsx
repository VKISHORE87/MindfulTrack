import React from 'react';
import { useUserJourney } from '@/contexts/UserJourneyContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export function JourneyProgress() {
  const { steps, currentStep, getProgressPercentage } = useUserJourney();
  const progressPercentage = getProgressPercentage();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Career Journey</span>
          <Badge variant="outline">{Math.round(progressPercentage)}% Complete</Badge>
        </CardTitle>
        <CardDescription>
          Follow the steps below to build your career development plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercentage} className="w-full" />
        
        <div className="space-y-2">
          {steps.filter(step => step.isRequired).map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                step.id === currentStep
                  ? 'border-primary bg-primary/5'
                  : step.isCompleted
                  ? 'border-green-200 bg-green-50'
                  : step.isUnlocked
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : step.isUnlocked ? (
                  <Circle className="h-5 w-5 text-gray-400" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{step.icon}</span>
                  <span className={`font-medium ${
                    step.isUnlocked ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                  {step.id === currentStep && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
                <p className={`text-sm ${
                  step.isUnlocked ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <Badge 
                  variant={step.isCompleted ? 'default' : step.isUnlocked ? 'outline' : 'secondary'}
                  className="text-xs"
                >
                  {step.isCompleted ? 'Complete' : step.isUnlocked ? 'Available' : 'Locked'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}