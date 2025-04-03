import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Settings, Target, Calendar, Check, AlertCircle, BookOpen } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  role: z.string().optional(),
});

const careerGoalSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  timelineMonths: z.string().transform(val => parseInt(val)),
  targetDate: z.string().optional(),
});

type ProfileValues = z.infer<typeof profileSchema>;
type CareerGoalValues = z.infer<typeof careerGoalSchema>;

export default function Profile({ user }: { user: any }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  // Fetch career goals
  const { data: careerGoals, isLoading: isLoadingGoals } = useQuery({
    queryKey: [`/api/users/${user.id}/career-goals`],
  });
  
  // Fetch validations
  const { data: validations, isLoading: isLoadingValidations } = useQuery({
    queryKey: [`/api/users/${user.id}/validations`],
  });
  
  // Fetch user skills
  const { data: userSkills, isLoading: isLoadingSkills } = useQuery({
    queryKey: [`/api/users/${user.id}/skills`],
  });
  
  // Fetch user progress
  const { data: userProgress, isLoading: isLoadingProgress } = useQuery({
    queryKey: [`/api/users/${user.id}/progress`],
  });
  
  const isLoading = isLoadingGoals || isLoadingValidations || isLoadingSkills || isLoadingProgress;
  
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role || "",
    },
  });
  
  const careerGoalForm = useForm<CareerGoalValues>({
    resolver: zodResolver(careerGoalSchema),
    defaultValues: {
      title: careerGoals && careerGoals[0] ? careerGoals[0].title : "",
      description: careerGoals && careerGoals[0] ? careerGoals[0].description : "",
      timelineMonths: careerGoals && careerGoals[0] ? careerGoals[0].timelineMonths.toString() : "6",
      targetDate: careerGoals && careerGoals[0] && careerGoals[0].targetDate 
        ? new Date(careerGoals[0].targetDate).toISOString().split('T')[0] 
        : "",
    },
  });
  
  const onProfileSubmit = async (values: ProfileValues) => {
    try {
      await apiRequest("PATCH", `/api/users/${user.id}`, values);
      
      // Invalidate user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    }
  };
  
  const onCareerGoalSubmit = async (values: CareerGoalValues) => {
    try {
      const goalData = {
        userId: user.id,
        title: values.title,
        description: values.description || "",
        timelineMonths: values.timelineMonths,
        targetDate: values.targetDate ? new Date(values.targetDate).toISOString() : null,
      };
      
      if (careerGoals && careerGoals.length > 0) {
        // Update existing goal
        await apiRequest("PATCH", `/api/career-goals/${careerGoals[0].id}`, goalData);
      } else {
        // Create new goal
        await apiRequest("POST", "/api/career-goals", goalData);
      }
      
      // Invalidate career goals data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/career-goals`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}/dashboard`] });
      
      toast({
        title: "Career goal updated",
        description: "Your career goal has been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was a problem saving your career goal.",
        variant: "destructive",
      });
    }
  };
  
  // Calculate stats
  const validatedSkillsCount = validations?.length || 0;
  const skillsCount = userSkills?.length || 0;
  
  const completedResourcesCount = userProgress?.filter(p => p.completed)?.length || 0;
  const totalResourcesCount = userProgress?.length || 0;
  
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
        <h2 className="text-2xl font-bold mb-2">My Profile</h2>
        <p className="text-gray-600">Manage your account settings and career goals.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-3xl mb-4">
                  {user.name.charAt(0)}
                </div>
                <h3 className="text-xl font-bold mb-1">{user.name}</h3>
                <p className="text-gray-500 mb-4">{user.role || 'User'}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="text-center border rounded-md p-3">
                    <p className="text-2xl font-bold text-primary">{validatedSkillsCount}</p>
                    <p className="text-xs text-gray-500">Validated Skills</p>
                  </div>
                  <div className="text-center border rounded-md p-3">
                    <p className="text-2xl font-bold text-primary">{completedResourcesCount}</p>
                    <p className="text-xs text-gray-500">Completed Resources</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-start"
                  onClick={() => setActiveTab("account")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-start"
                  onClick={() => setActiveTab("career")}
                >
                  <Target className="mr-2 h-4 w-4" />
                  Career Goals
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="account">Account Settings</TabsTrigger>
              <TabsTrigger value="career">Career Goals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Account Settings</h3>
                      <p className="text-sm text-gray-500">Update your personal information</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your current role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Software Developer">Software Developer</SelectItem>
                                <SelectItem value="Marketing Executive">Marketing Executive</SelectItem>
                                <SelectItem value="Finance Professional">Finance Professional</SelectItem>
                                <SelectItem value="Product Manager">Product Manager</SelectItem>
                                <SelectItem value="Student">Student</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="bg-primary hover:bg-primary-700">
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="career">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Career Goals</h3>
                      <p className="text-sm text-gray-500">Define your professional development target</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Form {...careerGoalForm}>
                    <form onSubmit={careerGoalForm.handleSubmit(onCareerGoalSubmit)} className="space-y-6">
                      <FormField
                        control={careerGoalForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Role/Position</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Senior Data Analyst" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={careerGoalForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description of your career goal" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={careerGoalForm.control}
                        name="timelineMonths"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeline (Months)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="60" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={careerGoalForm.control}
                        name="targetDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="bg-primary hover:bg-primary-700">
                        {careerGoals && careerGoals.length > 0 ? "Update Goal" : "Set Goal"}
                      </Button>
                    </form>
                  </Form>
                  
                  {careerGoals && careerGoals.length > 0 && (
                    <div className="mt-8 border-t pt-6">
                      <h4 className="text-lg font-medium mb-4">Current Career Goal</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <div className="flex items-center">
                          <div className="bg-primary-100 p-2 rounded-full mr-3">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h5 className="font-medium">{careerGoals[0].title}</h5>
                            <p className="text-sm text-gray-500">{careerGoals[0].description}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm">
                              Timeline: {careerGoals[0].timelineMonths} months
                            </span>
                          </div>
                          
                          {careerGoals[0].targetDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm">
                                Target: {new Date(careerGoals[0].targetDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
