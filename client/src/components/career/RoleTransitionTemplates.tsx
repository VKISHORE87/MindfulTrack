import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  ExternalLink,
  ArrowRightCircle,
  Search,
  BookOpen,
  Award,
  Clock,
  Filter,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample predefined role transitions
type RoleTransition = {
  id: string;
  sourceRole: string;
  targetRole: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeEstimate: string;
  commonPathway: string;
  keySkillsToAcquire: string[];
  transferableSkills: string[];
  industryAlignment: string[];
  resources: Array<{
    title: string;
    type: string;
    url?: string;
  }>;
  successStories?: Array<{
    name: string;
    timeframe: string;
    keyInsight: string;
  }>;
};

// Predefined role transitions
const ROLE_TRANSITIONS: RoleTransition[] = [
  {
    id: "dev-to-pm",
    sourceRole: "Software Developer",
    targetRole: "Product Manager",
    difficulty: "moderate",
    timeEstimate: "12-18 months",
    commonPathway: "Developer → Technical Product Owner → Associate Product Manager → Product Manager",
    keySkillsToAcquire: [
      "User Research",
      "Product Strategy",
      "Stakeholder Management",
      "Roadmapping",
      "Market Analysis",
      "User Story Writing"
    ],
    transferableSkills: [
      "Technical Knowledge",
      "Problem Solving",
      "System Thinking",
      "Communication",
      "Attention to Detail"
    ],
    industryAlignment: ["SaaS", "Enterprise Software", "Consumer Tech"],
    resources: [
      { title: "Product Management Fundamentals", type: "course" },
      { title: "User Research Methods", type: "workshop" },
      { title: "Stakeholder Management", type: "article" },
      { title: "Market Analysis Framework", type: "template" }
    ],
    successStories: [
      {
        name: "Alex T.",
        timeframe: "14 months",
        keyInsight: "Volunteered for customer-facing roles to gain exposure to user needs"
      },
      {
        name: "Sarah K.",
        timeframe: "16 months",
        keyInsight: "Created side projects to demonstrate product thinking"
      }
    ]
  },
  {
    id: "qa-to-data",
    sourceRole: "QA Engineer",
    targetRole: "Data Analyst",
    difficulty: "moderate",
    timeEstimate: "8-12 months",
    commonPathway: "QA Engineer → QA Automation → Data Quality Analyst → Junior Data Analyst → Data Analyst",
    keySkillsToAcquire: [
      "SQL",
      "Data Visualization",
      "Statistical Analysis",
      "Python/R",
      "Business Intelligence Tools",
      "Data Modeling"
    ],
    transferableSkills: [
      "Attention to Detail",
      "Analytical Thinking",
      "Testing Methodologies",
      "Problem Solving",
      "Documentation"
    ],
    industryAlignment: ["Finance", "E-commerce", "Healthcare", "SaaS"],
    resources: [
      { title: "SQL for Data Analysis", type: "course" },
      { title: "Python Basics for Data Science", type: "workshop" },
      { title: "Tableau Fundamentals", type: "certification" },
      { title: "Statistical Analysis Primer", type: "book" }
    ],
    successStories: [
      {
        name: "Michael R.",
        timeframe: "10 months",
        keyInsight: "Used QA metrics to build first data portfolio"
      }
    ]
  },
  {
    id: "dev-to-devops",
    sourceRole: "Software Developer",
    targetRole: "DevOps Engineer",
    difficulty: "moderate",
    timeEstimate: "6-12 months",
    commonPathway: "Developer → CI/CD Specialist → Cloud Infrastructure Engineer → DevOps Engineer",
    keySkillsToAcquire: [
      "Containerization (Docker)",
      "Orchestration (Kubernetes)",
      "Infrastructure as Code",
      "CI/CD Pipelines",
      "Cloud Platforms (AWS/Azure/GCP)",
      "Monitoring & Observability"
    ],
    transferableSkills: [
      "Scripting",
      "System Architecture",
      "Problem Solving",
      "Version Control",
      "Debugging"
    ],
    industryAlignment: ["Cloud Services", "SaaS", "FinTech", "E-commerce"],
    resources: [
      { title: "Docker & Kubernetes Fundamentals", type: "course" },
      { title: "Infrastructure as Code with Terraform", type: "workshop" },
      { title: "CI/CD with GitHub Actions", type: "tutorial" },
      { title: "Cloud Platform Certification", type: "certification" }
    ],
    successStories: [
      {
        name: "Priya M.",
        timeframe: "8 months",
        keyInsight: "Led containerization initiative to demonstrate DevOps skills"
      }
    ]
  },
  {
    id: "ba-to-ux",
    sourceRole: "Business Analyst",
    targetRole: "UX Designer",
    difficulty: "moderate",
    timeEstimate: "9-15 months",
    commonPathway: "Business Analyst → Requirements Analyst → UX Researcher → Junior UX Designer → UX Designer",
    keySkillsToAcquire: [
      "User Research",
      "Wireframing",
      "Prototyping",
      "Design Thinking",
      "Usability Testing",
      "Design Tools (Figma/Sketch)"
    ],
    transferableSkills: [
      "User Interviews",
      "Requirements Gathering",
      "Process Mapping",
      "Critical Thinking",
      "Stakeholder Management"
    ],
    industryAlignment: ["Digital Products", "E-commerce", "FinTech", "Healthcare"],
    resources: [
      { title: "Intro to UX Design", type: "course" },
      { title: "Design Thinking Workshop", type: "workshop" },
      { title: "Figma Fundamentals", type: "tutorial" },
      { title: "Usability Testing Methods", type: "article" }
    ],
    successStories: [
      {
        name: "James L.",
        timeframe: "12 months",
        keyInsight: "Created UX portfolio by redesigning existing products"
      }
    ]
  },
  {
    id: "pm-to-agile",
    sourceRole: "Project Manager",
    targetRole: "Agile Coach",
    difficulty: "moderate",
    timeEstimate: "9-12 months",
    commonPathway: "Project Manager → Scrum Master → Agile Team Lead → Agile Coach",
    keySkillsToAcquire: [
      "Agile Methodologies",
      "Team Facilitation",
      "Coaching Techniques",
      "Change Management",
      "Servant Leadership",
      "Organizational Development"
    ],
    transferableSkills: [
      "Team Leadership",
      "Planning",
      "Communication",
      "Stakeholder Management",
      "Problem Resolution"
    ],
    industryAlignment: ["Software Development", "Finance", "Healthcare", "Consulting"],
    resources: [
      { title: "Certified Scrum Master", type: "certification" },
      { title: "Advanced Facilitation Techniques", type: "workshop" },
      { title: "Coaching Fundamentals", type: "course" },
      { title: "Change Management Models", type: "article" }
    ],
    successStories: [
      {
        name: "Teresa K.",
        timeframe: "10 months",
        keyInsight: "Volunteered to lead team's agile transformation"
      }
    ]
  }
];

const RoleTransitionTemplates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [selectedTransition, setSelectedTransition] = useState<RoleTransition | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Filter roles based on search term and difficulty
  const filteredTransitions = ROLE_TRANSITIONS.filter(transition => {
    const matchesSearch = 
      searchTerm === "" || 
      transition.sourceRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transition.targetRole.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = difficultyFilter === "all" || transition.difficulty === difficultyFilter;
    
    return matchesSearch && matchesDifficulty;
  });

  // Query to fetch roles by name
  const fetchRoleByName = async (roleName: string): Promise<number | null> => {
    try {
      // Get all roles
      const res = await fetch('/api/interview/roles');
      if (!res.ok) {
        throw new Error('Failed to fetch roles');
      }
      
      const roles = await res.json();
      
      // Find the role with matching name
      const role = roles.find((r: any) => 
        r.title.toLowerCase() === roleName.toLowerCase() ||
        r.title.toLowerCase().includes(roleName.toLowerCase())
      );
      
      return role ? role.id : null;
    } catch (error) {
      console.error('Error finding role by name:', error);
      return null;
    }
  };

  // Handle using a template
  const handleUseTemplate = async (transition: RoleTransition) => {
    setSelectedTransition(transition);
    
    // Find target role ID
    const targetRoleId = await fetchRoleByName(transition.targetRole);
    
    if (targetRoleId) {
      // Set this as a career goal
      try {
        const response = await fetch('/api/users/career-goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roleId: targetRoleId,
            timeframe: transition.timeEstimate,
            priority: 'high',
            notes: `Using transition template: ${transition.sourceRole} → ${transition.targetRole}`,
          }),
        });
        
        if (response.ok) {
          toast({
            title: "Career Goal Set",
            description: `${transition.targetRole} has been set as your career goal with the transition template applied.`,
          });
          
          // Navigate to role comparison tab to view the selected role
          navigate('/career-transitions?tab=role-comparison');
        } else {
          toast({
            title: "Error",
            description: "Failed to set career goal. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error setting career goal:', error);
        toast({
          title: "Error",
          description: "Failed to set career goal. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Role Not Found",
        description: `Could not find ${transition.targetRole} in the system. Template has been applied but career goal was not set.`,
        variant: "destructive",
      });
    }
  };

  // Handle exploring a role in detail
  const handleExploreRole = (roleName: string) => {
    // Redirect to role comparison page with pre-filled target role
    toast({
      title: "Redirecting",
      description: `Taking you to explore ${roleName} in more detail.`,
    });
    // Navigate to the role comparison page, you'll need to implement the actual redirect logic
    // For now, just show a toast
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Role Transition Templates
          </CardTitle>
          <CardDescription>
            Pre-defined transition pathways to help you navigate common career switches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search source or target roles..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>{difficultyFilter === "all" ? "All Difficulties" : 
                           difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1)}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredTransitions.length === 0 ? (
            <div className="text-center py-10">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium">No matching transitions found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search terms or filters to see more results.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTransitions.map((transition) => (
                <Card key={transition.id} className="border-2 hover:border-primary/50 transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {transition.sourceRole} <ArrowRightCircle className="inline h-4 w-4 mx-1" /> {transition.targetRole}
                        </CardTitle>
                        <CardDescription>{transition.commonPathway}</CardDescription>
                      </div>
                      <Badge className={
                        transition.difficulty === 'easy' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : transition.difficulty === 'moderate'
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }>
                        {transition.difficulty.charAt(0).toUpperCase() + transition.difficulty.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Typical transition: <strong>{transition.timeEstimate}</strong></span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Key skills to acquire:</div>
                        <div className="flex flex-wrap gap-1">
                          {transition.keySkillsToAcquire.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="bg-primary/5">
                              {skill}
                            </Badge>
                          ))}
                          {transition.keySkillsToAcquire.length > 3 && (
                            <Badge variant="outline" className="bg-secondary/20">
                              +{transition.keySkillsToAcquire.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExploreRole(transition.targetRole)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Explore Role
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleUseTemplate(transition)}
                    >
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTransition && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>
              <span className="text-2xl font-bold">
                {selectedTransition.sourceRole} <ArrowRightCircle className="inline h-5 w-5 mx-2" /> {selectedTransition.targetRole}
              </span>
            </CardTitle>
            <CardDescription>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Typical transition time: <span className="font-medium ml-1">{selectedTransition.timeEstimate}</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pathway" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pathway">Career Pathway</TabsTrigger>
                <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
                <TabsTrigger value="stories">Success Stories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pathway" className="space-y-4 mt-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Common Transition Pathway</h3>
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-primary/30"></div>
                    {selectedTransition.commonPathway.split('→').map((step, i, arr) => (
                      <div key={i} className="flex items-start mb-4 relative">
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center z-10 
                          ${i === 0 ? 'bg-primary text-white' : 
                            i === arr.length - 1 ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}
                        `}>
                          {i === 0 ? '1' : i === arr.length - 1 ? <CheckCircle className="h-3 w-3" /> : i + 1}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium">{step.trim()}</div>
                          {i === 0 && <div className="text-sm text-muted-foreground">Starting point</div>}
                          {i === arr.length - 1 && <div className="text-sm text-green-600">Target role</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Industry Alignment</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    This transition path is particularly common in these industries:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTransition.industryAlignment.map(industry => (
                      <Badge key={industry} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="skills" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Skills to Acquire</h3>
                    <div className="space-y-3">
                      {selectedTransition.keySkillsToAcquire.map(skill => (
                        <div key={skill} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-primary" />
                            <span>{skill}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            Add to Plan
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Transferable Skills</h3>
                    <div className="space-y-3">
                      {selectedTransition.transferableSkills.map(skill => (
                        <div key={skill} className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Recommended Learning Resources</h3>
                <div className="space-y-3">
                  {selectedTransition.resources.map((resource, index) => (
                    <Card key={index}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div className="flex items-center">
                          <Badge className="mr-2" variant="outline">
                            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                          </Badge>
                          <span className="font-medium">{resource.title}</span>
                        </div>
                        <Button size="sm">
                          {resource.url ? "View" : "Find Similar"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="stories" className="space-y-4 mt-4">
                {selectedTransition.successStories && selectedTransition.successStories.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Success Stories</h3>
                    <div className="space-y-4">
                      {selectedTransition.successStories.map((story, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{story.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  Transition time: {story.timeframe}
                                </p>
                              </div>
                              <Award className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="mt-2">
                              <p className="text-sm">
                                <span className="font-medium">Key insight:</span> {story.keyInsight}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium">No success stories yet</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      Be the first to succeed with this transition path and share your story with the community!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoleTransitionTemplates;