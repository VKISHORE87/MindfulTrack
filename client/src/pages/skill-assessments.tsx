import React from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillsDashboard } from "@/components/skills/SkillsDashboard";
import SkillAssessmentExam from "@/components/practice/SkillAssessmentExam";
import { BookOpen, Activity } from "lucide-react";

export default function SkillAssessmentsPage({ user }: { user: any }) {
  return (
    <>
      <Helmet>
        <title>Skills | Upcraft</title>
      </Helmet>
      
      <div className="container py-6 space-y-8">
        <PageHeader 
          heading="Skills Management" 
          subheading="Track, update, and assess your skills to monitor your progress toward career goals"
        />
        
        <Tabs defaultValue="dashboard">
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Skills Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Skill Assessments</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <SkillsDashboard userId={user.id} />
          </TabsContent>
          
          <TabsContent value="assessments" className="mt-6">
            <div className="space-y-6">
              <SkillAssessmentExam />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}