import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ChevronRight, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useCareerGoal } from "@/contexts/CareerGoalContext";

interface AlternateRole {
  id: number;
  title: string;
  match?: number;
  description?: string;
  industry?: string;
}

interface CareerPathRecommendationsProps {
  alternateRoles?: AlternateRole[];
  maxDisplayed?: number;
}

export default function CareerPathRecommendations({ 
  alternateRoles = [],
  maxDisplayed = 3
}: CareerPathRecommendationsProps) {
  const { currentGoal } = useCareerGoal();
  
  // Limit the number of roles displayed
  const displayRoles = alternateRoles.slice(0, maxDisplayed);
  
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Briefcase className="h-5 w-5 text-primary mr-2" />
          <h3 className="font-semibold text-lg">Alternate Career Paths</h3>
        </div>
      </CardHeader>
      <CardContent>
        {displayRoles.length > 0 ? (
          <div className="space-y-3">
            {displayRoles.map((role, index) => (
              <div key={index} className="group">
                <Link href={`/career-transitions?targetRoleId=${role.id}`}>
                  <div className="flex items-start p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-colors">
                    <div className="flex-grow">
                      <div className="flex items-center">
                        <p className="font-medium text-gray-800 group-hover:text-primary transition-colors">
                          {role.title}
                        </p>
                        {role.match && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            {role.match}% match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {role.industry || "Technology"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 ml-2 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            {currentGoal ? (
              <p className="text-gray-600">
                Explore more roles related to {currentGoal.title}
              </p>
            ) : (
              <p className="text-gray-600">
                Set a career goal to see alternate path recommendations
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Link href="/career-transitions" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
          Explore all career paths
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}