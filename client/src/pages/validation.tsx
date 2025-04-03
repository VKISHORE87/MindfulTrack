import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Award, CheckCircle, Link as LinkIcon, FileCheck, AlertCircle, Shield } from "lucide-react";

const validationSchema = z.object({
  skillId: z.string().min(1, "Please select a skill"),
  validationType: z.enum(["assessment", "project", "certification", "peer_review", "self_assessment"]),
  score: z.string().transform(val => parseInt(val)),
  evidence: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

type ValidationValues = z.infer<typeof validationSchema>;

export default function Validation({ user }: { user: any }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("validate");
  
  const form = useForm<ValidationValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      skillId: "",
      validationType: "assessment",
      score: "0",
      evidence: "",
    },
  });
  
  // Fetch user skills
  const { data: userSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: [`/api/users/${user.id}/skills`],
  });
  
  // Fetch all skills (for dropdown)
  const { data: allSkills, isLoading: isLoadingAllSkills } = useQuery({
    queryKey: ['/api/skills'],
  });
  
  // Fetch validations
  const { data: validations, isLoading: isLoadingValidations } = useQuery({
    queryKey: [`/api/users/${user.id}/validations`],
  });
  
  const isLoading = isLoadingSkills || isLoadingAllSkills || isLoadingValidations;
  
  const onSubmit = async (values: ValidationValues) => {
    try {
      const validationData = {
        userId: user.id,
        skillId: parseInt(values.skillId),
        validationType: values.validationType,
        score: values.score,
        evidence: values.evidence,
        validatedBy: 0 // System validated
      };
      
      await apiRequest("POST", "/api/skill-validations", validationData);
      
      // Invalidate validations to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/validations`] });
      
      toast({
        title: "Skill validated",
        description: "Your skill validation has been recorded.",
      });
      
      // Reset form
      form.reset();
      
      // Switch to credentials tab to show the new validation
      setActiveTab("credentials");
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "There was a problem validating your skill.",
        variant: "destructive",
      });
    }
  };
  
  const getSkillById = (skillId: number) => {
    return allSkills?.find(skill => skill.id === skillId);
  };
  
  const getValidationTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <FileCheck className="h-5 w-5 text-blue-600" />;
      case 'project':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'certification':
        return <Award className="h-5 w-5 text-amber-500" />;
      case 'peer_review':
        return <Shield className="h-5 w-5 text-purple-600" />;
      default:
        return <FileCheck className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Skill Validation</h2>
        <p className="text-gray-600">Validate your skills with assessments, projects, and credentials.</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="validate">Validate Skills</TabsTrigger>
          <TabsTrigger value="credentials">Your Credentials</TabsTrigger>
        </TabsList>
        
        <TabsContent value="validate">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Validate Your Skills</h3>
                      <p className="text-sm text-gray-500">Submit evidence of your skills for validation</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="skillId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Skill to Validate</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a skill" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {userSkills?.map((skill) => (
                                  <SelectItem key={skill.skillId} value={skill.skillId.toString()}>
                                    {skill.skillName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="validationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Validation Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select validation type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="assessment">Assessment</SelectItem>
                                <SelectItem value="project">Project</SelectItem>
                                <SelectItem value="certification">Certification</SelectItem>
                                <SelectItem value="peer_review">Peer Review</SelectItem>
                                <SelectItem value="self_assessment">Self Assessment</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="score"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Score (0-100)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="evidence"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Evidence URL (Optional)</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <div className="bg-gray-100 border-y border-l border-gray-300 rounded-l-md p-2 flex items-center">
                                  <LinkIcon className="h-4 w-4 text-gray-500" />
                                </div>
                                <Input 
                                  placeholder="https://example.com/your-certification" 
                                  className="rounded-l-none" 
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <p className="text-xs text-gray-500 mt-1">
                              Link to project, certificate, or assessment results
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="bg-primary hover:bg-primary-700">
                        Submit for Validation
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Validation Process</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-lg flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
                      <span className="font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Select a Skill</h4>
                      <p className="text-sm text-gray-600">Choose the skill you want to validate from your skill profile</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
                      <span className="font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Add Evidence</h4>
                      <p className="text-sm text-gray-600">Provide a link to your project, certificate, or assessment results</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
                      <span className="font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Rate Your Mastery</h4>
                      <p className="text-sm text-gray-600">Provide an honest self-assessment of your skill level</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg flex items-start">
                    <div className="bg-blue-100 rounded-full p-2 mr-3 mt-1">
                      <span className="font-semibold text-blue-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Receive Credential</h4>
                      <p className="text-sm text-gray-600">Upon validation, your skill credential will be added to your profile</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="credentials">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {validations && validations.length > 0 ? (
              validations.map((validation) => {
                const skill = getSkillById(validation.skillId);
                
                return (
                  <Card key={validation.id} className="overflow-hidden">
                    <div className="bg-primary h-2"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Award className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-semibold">{skill?.name || 'Unknown Skill'}</h3>
                        </div>
                        <div className="bg-gray-100 rounded-full px-2 py-1 text-xs font-medium capitalize">
                          {skill?.category || 'Unknown'}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="my-4 flex items-center justify-center">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-bold text-primary">{validation.score}%</span>
                          </div>
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1">
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Validation Type:</span>
                          <div className="flex items-center">
                            {getValidationTypeIcon(validation.validationType)}
                            <span className="ml-1 capitalize">{validation.validationType}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Validated On:</span>
                          <span>{new Date(validation.validatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {validation.evidence && (
                        <div className="mt-4 p-2 bg-gray-50 border border-gray-100 rounded-md flex items-center">
                          <LinkIcon className="h-4 w-4 text-gray-500 mr-2" />
                          <a 
                            href={validation.evidence} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary truncate"
                          >
                            View Evidence
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full">
                <Card className="text-center py-12">
                  <CardContent>
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Credentials Yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      You haven't validated any skills yet. Validate your skills to earn credentials that showcase your expertise.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("validate")}
                      className="bg-primary hover:bg-primary-700"
                    >
                      Start Validating Skills
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
