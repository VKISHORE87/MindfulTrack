import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { useCareerGoal } from "@/contexts/CareerGoalContext";
import { useTargetRole } from "@/contexts/TargetRoleContext";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

interface SkillChatbotProps {
  initialPrompt?: string;
  className?: string;
}

export default function SkillChatbot({ initialPrompt, className }: SkillChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt || "");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const { currentGoal } = useCareerGoal();
  const { targetRole } = useTargetRole();
  
  // Set welcome message on first load
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        role: "assistant" as const,
        content: `👋 Hi! I'm your AI skill advisor. I can help with:
        
• Recommending skills for your target role
• Providing learning resources for specific skills
• Answering questions about career development
• Creating personalized learning plans

How can I assist your skill development today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);
  
  // Scroll to bottom of chat on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Get target role title from context
      const targetRoleTitle = targetRole?.title || currentGoal?.title || "";
      
      // Call API to get response from the AI
      const response = await fetch("/api/chat/skill-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
          userId: user?.id || 1,
          targetRole: targetRoleTitle,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get response from AI advisor");
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get response from AI advisor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle predefined prompts
  const handlePredefinedPrompt = (prompt: string) => {
    setInput(prompt);
  };
  
  // Reset chat
  const resetChat = () => {
    setMessages([]);
    setInput("");
  };
  
  return (
    <Card className={`flex flex-col h-[600px] ${className}`}>
      <CardHeader className="px-4 py-3 border-b flex flex-row justify-between items-center">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-medium">Skill Advisor AI</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetChat}
          title="Reset conversation"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div className="flex items-center mb-1">
                {message.role === "user" ? (
                  <User className="h-4 w-4 mr-2" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                <span className="text-xs opacity-70">
                  {message.role === "user" ? "You" : "AI Advisor"}
                  {message.timestamp && 
                    ` • ${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  }
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2 rounded-lg bg-muted">
              <div className="flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                <span className="text-xs opacity-70">AI Advisor</span>
              </div>
              <div className="animate-pulse mt-2 flex space-x-1">
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <div className="px-4 py-2">
        <div className="flex flex-wrap gap-2 mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7"
            onClick={() => handlePredefinedPrompt("What skills should I learn for my target role?")}
          >
            <Plus className="h-3 w-3 mr-1" />
            Skills for my role
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7"
            onClick={() => handlePredefinedPrompt("How can I improve my programming skills?")}
          >
            <Plus className="h-3 w-3 mr-1" />
            Improve programming
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-7"
            onClick={() => handlePredefinedPrompt("Create a learning path for me")}
          >
            <Plus className="h-3 w-3 mr-1" />
            Learning path
          </Button>
        </div>
        
        <Separator className="my-2" />
      </div>
      
      <CardFooter className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Textarea
            placeholder="Ask about skills, learning resources, or career advice..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-10 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}