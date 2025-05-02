import React from "react";
import { Helmet } from "react-helmet";
import { PageHeader } from "@/components/ui/page-header";
import SkillAssessmentExam from "@/components/practice/SkillAssessmentExam";

export default function SkillAssessmentsPage() {
  return (
    <>
      <Helmet>
        <title>Skill Assessments | Upcraft</title>
      </Helmet>
      
      <div className="container py-6 space-y-8">
        <PageHeader 
          heading="Skill Assessments" 
          subheading="Evaluate your proficiency in specific skills, receive personalized feedback, and identify areas for improvement"
        />
        
        <div className="space-y-6">
          <SkillAssessmentExam />
        </div>
      </div>
    </>
  );
}