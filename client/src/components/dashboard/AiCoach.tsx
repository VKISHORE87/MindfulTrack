import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, ArrowRight, SendIcon, RefreshCw } from 'lucide-react';
import { AiCoachResponse } from '@/lib/openai';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AiCoachProps {
  userId: number;
}

export default function AiCoach({ userId }: AiCoachProps) {
  const [userQuery, setUserQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the latest coach response if it exists
  const { 
    data: coachResponse, 
    isLoading,
    isError,
    refetch
  } = useQuery<AiCoachResponse>({
    queryKey: [`/api/users/${userId}/ai-coach`],
    enabled: isExpanded,
  });

  // Mutation for sending new queries to the AI coach
  const mutation = useMutation({
    mutationFn: (query: string) => 
      apiRequest('POST', `/api/users/${userId}/ai-coach`, { query }),
    onSuccess: () => {
      // Invalidate the coach query to refetch with new data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/ai-coach`] });
      toast({
        title: "Query sent successfully",
        description: "Your AI coach is generating a response.",
      });
      setUserQuery('');
    },
    onError: (error) => {
      toast({
        title: "Error sending query",
        description: "There was a problem communicating with the AI coach.",
        variant: "destructive",
      });
    }
  });

  const handleSendQuery = () => {
    if (!userQuery.trim()) return;
    mutation.mutate(userQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuery();
    }
  };

  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        className="flex items-center gap-2 bg-white shadow-sm" 
        onClick={() => setIsExpanded(true)}
      >
        <MessageCircle className="h-4 w-4" />
        Ask your AI Coach
      </Button>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            AI Coach
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(false)}
          >
            Minimize
          </Button>
        </div>
        <CardDescription>
          Your personalized learning assistant. Ask about skills, career advice, or learning strategies.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-gray-500">
            <p>There was an error loading your AI coach.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : coachResponse ? (
          <div className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="font-medium mb-2">Message</p>
              <p className="text-gray-700">{coachResponse.message}</p>
            </div>
            
            <div className="rounded-lg p-4 border border-gray-200">
              <p className="font-medium mb-2">Advice</p>
              <p className="text-gray-700">{coachResponse.advice}</p>
            </div>
            
            {coachResponse.nextSteps?.length > 0 && (
              <div className="rounded-lg p-4 border border-gray-200">
                <p className="font-medium mb-2">Suggested Next Steps</p>
                <ul className="space-y-2">
                  {coachResponse.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{step.action}</p>
                        <p className="text-sm text-gray-600">{step.rationale}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {coachResponse.encouragement && (
              <div className="text-center italic text-gray-600 py-2">
                "{coachResponse.encouragement}"
              </div>
            )}
            
            {coachResponse.challengeQuestion && (
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="font-medium mb-1">Challenge Question</p>
                <p className="text-gray-700">{coachResponse.challengeQuestion}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Ask your AI coach about your skill development journey.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Input
          placeholder="Ask a question..."
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={mutation.isPending}
          className="flex-1"
        />
        <Button 
          onClick={handleSendQuery} 
          disabled={!userQuery.trim() || mutation.isPending}
        >
          {mutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}