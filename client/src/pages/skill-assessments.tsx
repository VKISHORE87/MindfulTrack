import React from "react";
import { Helmet } from "react-helmet";
import RoleSpecificSkillAssessment from "@/components/skills/RoleSpecificSkillAssessment";

export default function SkillAssessmentsPage({ user }: { user: any }) {
  return (
    <>
      <Helmet>
        <title>Skill Assessment | Upcraft</title>
      </Helmet>
      
      <div className="container py-6">
        <RoleSpecificSkillAssessment user={user} />
      </div>
    </>
  );
}