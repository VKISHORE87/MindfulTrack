import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SendHorizonal, Bot, User, Sparkles, Info, ChevronDown, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/hooks/use-user";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";

// Message types
type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export default function SkillChatbot() {
  const { toast } = useToast();
  const { user } = useUser();
  
  // Mock skills for development - in production this would use context
  const userSkills = [
    { skillName: "Programming", currentLevel: 3, targetLevel: 5 },
    { skillName: "System Design", currentLevel: 2, targetLevel: 4 },
    { skillName: "Problem Solving", currentLevel: 4, targetLevel: 5 }
  ];
  
  // Mock target role - in production this would use context
  const targetRole = { title: "Artificial Intelligence Engineer" };
  
  // Mock career goals - in production this would use context
  const careerGoals = [
    { 
      title: "Become a Artificial Intelligence Engineer", 
      description: "Transition to an AI engineering role", 
      timelineMonths: 12,
      targetRoleTitle: "Artificial Intelligence Engineer"
    }
  ];
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your personal Skill Advisor. I can help you identify skill gaps, recommend learning resources, and create personalized development plans. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedInfo, setExpandedInfo] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat/skill-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          userId: user?.id,
          currentSkills: userSkills,
          targetRole: targetRole?.title,
          careerGoals: careerGoals,
        }),
      });
      
      if (!response.ok) {
        // Handle API quota or other errors gracefully
        if (response.status === 429) {
          const fallbackMessage: Message = {
            role: 'assistant',
            content: 'I understand you\'re asking about skill development. While I\'m currently experiencing high demand, I can still provide some guidance:\n\nFor your target role as an Artificial Intelligence Engineer, focus on:\n\n• **Programming**: Master Python, R, and SQL for data manipulation\n• **Machine Learning**: Study algorithms, neural networks, and deep learning\n• **Mathematics**: Strengthen statistics, linear algebra, and calculus\n• **Data Engineering**: Learn data pipelines, cloud platforms (AWS/GCP/Azure)\n• **AI Ethics**: Understand responsible AI development principles\n\nWould you like specific recommendations for any of these areas?',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, fallbackMessage]);
          return;
        }
        throw new Error('Failed to get a response from the AI advisor');
      }
      
      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      
      // Provide helpful fallback response based on user context
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `I understand you're asking about skill development. Based on your target role as ${targetRole?.title || 'your chosen career path'}, here are some key areas to focus on:\n\n• **Technical Skills**: Build strong foundation in programming and system design\n• **Problem Solving**: Practice algorithmic thinking and analytical reasoning\n• **Communication**: Develop technical writing and presentation skills\n• **Continuous Learning**: Stay updated with industry trends and best practices\n\nWhat specific skill would you like guidance on developing?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      
      toast({
        title: 'Using Offline Mode',
        description: 'Providing guidance based on your profile and target role.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderMessageContent = (content: string) => {
    // Split content by line breaks and process each line
    return content.split('\n').map((line, i) => {
      // Convert markdown-style bullet points to HTML
      if (line.trim().startsWith('- ')) {
        return (
          <li key={i} className="ml-4">
            {line.trim().substring(2)}
          </li>
        );
      }
      
      // Convert markdown-style headers to HTML
      if (line.trim().startsWith('# ')) {
        return <h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.trim().substring(2)}</h3>;
      }
      
      if (line.trim().startsWith('## ')) {
        return <h4 key={i} className="text-md font-bold mt-2 mb-1">{line.trim().substring(3)}</h4>;
      }
      
      // Handle empty lines with a small spacer
      if (line.trim() === '') {
        return <div key={i} className="h-2"></div>;
      }
      
      // Regular text
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-3 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-primary mr-2" />
            <span className="font-semibold">Skill Advisor AI</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpandedInfo(!expandedInfo)}
            className="h-8 px-2"
          >
            <Info className="h-4 w-4 mr-1" />
            <span className="text-xs">About</span>
            <ChevronDown className={`h-4 w-4 ml-1 transform transition-transform ${expandedInfo ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {expandedInfo && (
          <div className="bg-muted/50 p-3 text-sm border-b">
            <p>I'm your AI-powered Skill Advisor. I can help you:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Analyze your skill gaps based on your target role</li>
              <li>Recommend learning resources tailored to your needs</li>
              <li>Create customized learning paths for career growth</li>
              <li>Provide advice on skill development strategies</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Ask me specific questions about skills you want to develop or general career advice.
            </p>
          </div>
        )}
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex max-w-[80%] ${
                  message.role === 'user' 
                    ? 'flex-row-reverse' 
                    : 'flex-row'
                }`}
              >
                <div 
                  className={`flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary ml-2' 
                      : 'bg-secondary mr-2'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-secondary-foreground" />
                  )}
                </div>
                
                <div 
                  className={`rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card border shadow-sm'
                  }`}
                >
                  <div className="text-sm space-y-1">
                    {renderMessageContent(message.content)}
                  </div>
                  <div 
                    className={`flex items-center mt-1 text-xs ${
                      message.role === 'user' 
                        ? 'text-primary-foreground/70 justify-end' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary mr-2 flex-shrink-0">
                  <Bot className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div className="rounded-lg p-3 bg-card border shadow-sm">
                  <Spinner size="sm" />
                  <span className="ml-2 text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </CardContent>
        
        <Separator />
        
        <div className="p-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about skills, learning resources, or career advice..."
                className="pr-10 min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              {!isLoading && input.trim() && (
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 bottom-1 h-8 w-8"
                >
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
          <div className="mt-2 flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Powered by AI to provide personalized skill recommendations
            </div>
            {isLoading && <Spinner size="sm" className="mr-2" />}
          </div>
        </div>
      </Card>
    </div>
  );
}