import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle,
  XCircle,
  ArrowRightCircle,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface InterviewRole {
  id: number;
  title: string;
  description: string | null;
  requiredSkills: string[] | null;
  industry: string;
  level: string;
  roleType: string;
  averageSalary: string | null;
  growthRate: string | null;
  demandScore: number | null;
  createdAt: Date | null;
}

interface RoleComparisonCardProps {
  currentRole: InterviewRole | null;
  targetRole: InterviewRole | null;
  onViewLearningPath?: () => void;
}

export default function RoleComparisonCard({ 
  currentRole, 
  targetRole,
  onViewLearningPath 
}: RoleComparisonCardProps) {
  if (!currentRole || !targetRole) {
    return (
      <Card className="border-dashed border-gray-300 bg-gray-50">
        <CardContent className="pt-6 text-center text-gray-500">
          <p>Select both current and target roles to see a comparison</p>
        </CardContent>
      </Card>
    );
  }

  // Get skills from both roles
  const currentSkills = Array.isArray(currentRole.requiredSkills) ? currentRole.requiredSkills : [];
  const targetSkills = Array.isArray(targetRole.requiredSkills) ? targetRole.requiredSkills : [];
  
  // Create a set of current skills for easy lookup
  const currentSkillsSet = new Set(currentSkills.map(skill => 
    skill && typeof skill === 'string' ? skill.toLowerCase() : ''
  ).filter(skill => skill !== ''));
  
  // Find missing skills (skills in target role but not in current role)
  const missingSkills = targetSkills.filter(skill => 
    !currentSkillsSet.has(skill.toLowerCase())
  );
  
  // Find shared skills (skills in both roles)
  const sharedSkills = targetSkills.filter(skill => 
    currentSkillsSet.has(skill.toLowerCase())
  );

  const getRoleTypeColor = (roleType: string) => {
    const colors: {[key: string]: string} = {
      technical: "bg-blue-100 text-blue-800",
      creative: "bg-purple-100 text-purple-800",
      business: "bg-green-100 text-green-800",
      leadership: "bg-amber-100 text-amber-800",
      operations: "bg-slate-100 text-slate-800",
      customer_facing: "bg-pink-100 text-pink-800",
      healthcare: "bg-red-100 text-red-800",
      education: "bg-cyan-100 text-cyan-800",
      administrative: "bg-gray-100 text-gray-800",
      finance: "bg-emerald-100 text-emerald-800",
      legal: "bg-indigo-100 text-indigo-800",
      marketing: "bg-rose-100 text-rose-800",
      research: "bg-teal-100 text-teal-800",
      product: "bg-green-100 text-green-800",
      human_resources: "bg-orange-100 text-orange-800"
    };
    
    return colors[roleType] || "bg-gray-100 text-gray-800";
  };
  
  return (
    <Card className="overflow-hidden border-gray-200">
      <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200 pb-4">
        <CardTitle className="text-xl font-bold">Role Transition Path</CardTitle>
        <CardDescription>
          Skill comparison between your current and target roles
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Current Role Column */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200 bg-blue-50/30">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{currentRole.title}</h3>
              <Badge className={getRoleTypeColor(currentRole?.roleType || "")}>
                {currentRole?.roleType?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{currentRole.description}</p>
            
            <h4 className="font-medium mb-2 text-gray-700">Required Skills:</h4>
            <div className="space-y-1">
              {currentSkills.map((skill, index) => (
                <div key={index} className="flex items-center py-1">
                  <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                  <span className="text-sm">{skill}</span>
                </div>
              ))}
              {!currentSkills.length && (
                <div className="text-center py-2 text-gray-500">No skills listed</div>
              )}
            </div>
          </div>
          
          {/* Target Role Column */}
          <div className="p-4 bg-purple-50/30">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">{targetRole.title}</h3>
              <Badge className={getRoleTypeColor(targetRole?.roleType || "")}>
                {targetRole?.roleType?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{targetRole.description}</p>
            
            <h4 className="font-medium mb-2 text-gray-700">Required Skills:</h4>
            <div className="space-y-1">
              {targetSkills.map((skill, index) => (
                <div key={index} className="flex items-center py-1">
                  <CheckCircle className="h-4 w-4 text-purple-600 mr-2 flex-shrink-0" />
                  <span className="text-sm">{skill}</span>
                </div>
              ))}
              {!targetSkills.length && (
                <div className="text-center py-2 text-gray-500">No skills listed</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Missing Skills Section */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-gray-200">
          <h3 className="font-semibold text-lg mb-3">Skills to Develop for {targetRole.title}</h3>
          
          {missingSkills.length > 0 ? (
            <div className="space-y-2">
              {missingSkills.map((skill, index) => (
                <div key={index} className="flex items-center p-2 bg-white rounded-md border border-amber-200">
                  <ArrowRightCircle className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{skill}</p>
                    <p className="text-xs text-gray-500">New skill needed for this role transition</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-white rounded-md border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">No missing skills!</p>
                  <p className="text-sm text-gray-600">
                    Your current role as a {currentRole.title} already provides you with all the 
                    required skills for the {targetRole.title} position.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Shared Skills Section */}
        {sharedSkills.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 border-t border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Shared Skills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {sharedSkills.map((skill, index) => (
                <div key={index} className="flex items-center p-2 bg-white rounded-md border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions Section */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <Button 
            onClick={onViewLearningPath} 
            variant="secondary"
            className="bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Learning Path
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}