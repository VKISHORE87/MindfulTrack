import React, { useState } from 'react';
import { useProgress } from '@/contexts/ProgressContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  Loader2,
  ThumbsUp,
  FileText,
  BookOpen
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface ResourceProgressTrackerProps {
  resourceId: number;
  resourceTitle: string;
  resourceType?: string;
  isCompleted?: boolean;
  onUpdate?: () => void;
}

export const ResourceProgressTracker: React.FC<ResourceProgressTrackerProps> = ({
  resourceId,
  resourceTitle,
  resourceType = 'article',
  isCompleted = false,
  onUpdate
}) => {
  const { progressData, updateProgress, removeProgress, isLoading } = useProgress();
  
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find if this resource appears in progress data
  const resourceProgress = progressData?.resources?.find(resource => resource?.id === resourceId);

  const resourceCompleted = isCompleted || !!resourceProgress?.completed;

  const handleSubmitCompletion = async () => {
    setIsSubmitting(true);
    
    try {
      await updateProgress(resourceId, {
        rating,
        feedback,
        timeSpentMinutes: timeSpent
      });
      
      setShowCompletionForm(false);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating resource progress:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCompletion = async () => {
    try {
      await removeProgress(resourceId);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error removing resource progress:', error);
    }
  };

  const getResourceIcon = () => {
    switch (resourceType.toLowerCase()) {
      case 'video':
        return <Badge variant="outline" className="flex items-center gap-1"><Star className="h-3 w-3" /> Video</Badge>;
      case 'course':
        return <Badge variant="outline" className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Course</Badge>;
      case 'exercise':
        return <Badge variant="outline" className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> Exercise</Badge>;
      case 'documentation':
        return <Badge variant="outline" className="flex items-center gap-1"><FileText className="h-3 w-3" /> Documentation</Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1"><FileText className="h-3 w-3" /> Article</Badge>;
    }
  };

  return (
    <div className="relative">
      <Card className={`w-full transition-colors ${resourceCompleted ? 'border-green-200 bg-green-50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{resourceTitle}</CardTitle>
              <CardDescription>Resource ID: {resourceId}</CardDescription>
            </div>
            {getResourceIcon()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">{resourceCompleted ? '100%' : '0%'}</span>
            </div>
            <Progress value={resourceCompleted ? 100 : 0} className="h-2" />
            
            {resourceCompleted && resourceProgress && (
              <div className="mt-4 space-y-2 border p-2 rounded-md bg-background">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Rating</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < (resourceProgress.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                {resourceProgress.timeSpent && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Time spent</span>
                    <span className="text-xs">{resourceProgress.timeSpent} minutes</span>
                  </div>
                )}
                
                {resourceProgress.feedback && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Feedback</p>
                    <p className="text-xs mt-1 italic">{resourceProgress.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 justify-between">
          {!resourceCompleted ? (
            <Dialog open={showCompletionForm} onOpenChange={setShowCompletionForm}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Mark as Completed
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark Resource as Completed</DialogTitle>
                  <DialogDescription>
                    Share your experience with "{resourceTitle}"
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="rating">Rating</Label>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-5 w-5 cursor-pointer ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                            onClick={() => setRating(i + 1)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time-spent">Time Spent (minutes)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="time-spent"
                        min={5}
                        max={240}
                        step={5}
                        defaultValue={[timeSpent]}
                        value={[timeSpent]}
                        onValueChange={(value) => setTimeSpent(value[0])}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        id="time-spent-input"
                        value={timeSpent}
                        onChange={(e) => setTimeSpent(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Share your thoughts about this resource..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSubmitCompletion} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemoveCompletion}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Mark as Incomplete
            </Button>
          )}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {resourceCompleted ? 'Completed' : 'Not started'}
          </div>
        </CardFooter>
      </Card>
      
      {resourceCompleted && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        </div>
      )}
    </div>
  );
};