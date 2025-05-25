import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bot, Sparkles, BrainCircuit, MessageSquareText, Lightbulb, BookOpen } from "lucide-react";
import SkillChatbot from "@/components/chatbot/SkillChatbot";
import { useTargetRole } from "@/contexts/TargetRoleContext";

export default function SkillAdvisorPage() {
  const { targetRole } = useTargetRole();
  
  // Set page title
  useEffect(() => {
    document.title = "Skill Advisor AI | Upcraft";
  }, []);
  
  return (
    <>
      <Helmet>
        <title>Skill Advisor AI | Upcraft</title>
      </Helmet>
      
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center">
            <Bot className="h-7 w-7 text-primary mr-3" />
            Skill Advisor AI
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SkillChatbot />
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Sparkles className="h-5 w-5 text-primary mr-2" />
                  About Skill Advisor
                </CardTitle>
                <CardDescription>
                  Your AI-powered career development assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="mb-4">
                  The Skill Advisor uses advanced AI to provide personalized career guidance based on your goals and current skill level.
                </p>
                <div className="space-y-3">
                  <div className="flex">
                    <BrainCircuit className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Skill Gap Analysis</p>
                      <p className="text-muted-foreground text-xs">
                        Get insights on skills you need to develop for your target role
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <MessageSquareText className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Personalized Advice</p>
                      <p className="text-muted-foreground text-xs">
                        Receive tailored recommendations for your career journey
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Lightbulb className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Learning Resources</p>
                      <p className="text-muted-foreground text-xs">
                        Discover courses, tutorials, and materials to enhance your skills
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <BookOpen className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Learning Path Creation</p>
                      <p className="text-muted-foreground text-xs">
                        Get step-by-step plans to achieve your career goals
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Target Role</CardTitle>
              </CardHeader>
              <CardContent>
                {targetRole ? (
                  <div>
                    <p className="font-medium text-lg">{targetRole.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ask the AI advisor about skills needed for this role and how to acquire them.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">No target role selected</p>
                    <Link href="/career-transitions">
                      <Button variant="outline" size="sm" className="mt-2">
                        Set Target Role
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Suggested Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      // This would ideally set the chatbot input, but for now it's just a visual element
                      // We could implement a proper event system to communicate between components
                    }}
                  >
                    What skills should I focus on for my target role?
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto py-2"
                  >
                    How can I improve my programming skills?
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto py-2"
                  >
                    Create a learning path for me to become an AI Engineer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left h-auto py-2"
                  >
                    What are the best resources to learn machine learning?
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}