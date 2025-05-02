import React from "react";
import { Helmet } from "react-helmet";
import SkillAssessment from "@/components/skills/SkillAssessment";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SkillAssessmentsPage() {
  return (
    <>
      <Helmet>
        <title>Skill Assessments | Upcraft</title>
      </Helmet>
      
      <div className="container py-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Skill Assessments</h1>
          <p className="text-muted-foreground">
            Validate your skills, get personalized feedback, and track your progress toward job readiness.
          </p>
        </header>
        
        <div className="space-y-6">
          <SkillAssessment />
        </div>
      </div>
    </>
  );
}