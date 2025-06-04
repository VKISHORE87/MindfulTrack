import React from 'react';
import { useUserJourney } from '@/contexts/UserJourneyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

export function NextStepCard() {
  const { getNextStep, currentStep, steps } = useUserJourney();
  const nextStep = getNextStep();
  const currentStepData = steps.find(step => step.id === currentStep);

  if (!nextStep) {
    return (
      <Card className="w-full border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Journey Complete!</span>
          </CardTitle>
          <CardDescription className="text-green-600">
            Congratulations! You've completed all the required steps in your career development journey.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800">What's Next?</CardTitle>
        <CardDescription className="text-blue-600">
          Continue your career development journey with the next step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{nextStep.icon}</span>
          <div>
            <h3 className="font-semibold text-blue-900">{nextStep.title}</h3>
            <p className="text-sm text-blue-700">{nextStep.description}</p>
          </div>
        </div>
        
        <Link href={nextStep.path}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Continue to {nextStep.title}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}