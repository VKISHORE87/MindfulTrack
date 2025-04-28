import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Trophy, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CareerPath as BaseCareerPath } from '../../../../shared/schema';

// Extended career path type with UI-specific fields
interface PathStep {
  title: string;
  subtitle: string;
  description: string;
  timeEstimate: string;
  keySkills: string[];
}

interface PathResource {
  title: string;
  provider: string;
  type: string;
  url: string;
}

// For the role information included in the response
interface RoleInfo {
  id: number;
  title: string;
  description: string | null;
  industry: string;
  level: string;
  roleType: string;
  requiredSkills: string[] | null;
  averageSalary: string | null;
  growthRate: string | null;
  demandScore: number | null;
}

interface CareerPath extends BaseCareerPath {
  pathSteps?: PathStep[];
  resources?: PathResource[];
  roleInfo?: RoleInfo;
}

interface CareerPathComponentProps {
  roleId: number;
}

const CareerPathComponent: React.FC<CareerPathComponentProps> = ({ roleId }) => {
  const { data: careerPath, isLoading, error } = useQuery<CareerPath>({
    queryKey: ['/api/career/paths/role', roleId],
    queryFn: async () => {
      const res = await fetch(`/api/career/paths/role/${roleId}`);
      if (!res.ok) {
        if (res.status === 404) {
          // No career path found for this role is not an error, just return null
          return null;
        }
        throw new Error('Failed to fetch career path data');
      }
      
      const path = await res.json();
      
      // Transform the DB data into our UI-specific format
      // This would normally be done on the server, but for now we'll do it here
      if (path) {
        // Create path steps from the career path data
        const pathSteps: PathStep[] = [];
        
        // Previous role step
        if (path.previousRole) {
          pathSteps.push({
            title: path.previousRole,
            subtitle: "Previous Position",
            description: "The common role that precedes this career position",
            timeEstimate: "Past",
            keySkills: ["Foundation skills for this career track"]
          });
        }
        
        // Current role - using role info from the enhanced path response
        if (path.roleInfo) {
          // Use the role info that was included in the response
          pathSteps.push({
            title: path.roleInfo.title,
            subtitle: "Current Position",
            description: path.roleInfo.description || "Your current career position or target role",
            timeEstimate: "Present",
            keySkills: path.roleInfo.requiredSkills || []
          });
        } else {
          // Fallback to fetching the role if not included
          const roleRes = await fetch(`/api/interview/roles/${roleId}`);
          if (roleRes.ok) {
            const role = await roleRes.json();
            pathSteps.push({
              title: role.title,
              subtitle: "Current Position",
              description: "Your current career position or target role",
              timeEstimate: "Present",
              keySkills: role.requiredSkills || []
            });
          }
        }
        
        // Next role step
        if (path.nextRole) {
          pathSteps.push({
            title: path.nextRole,
            subtitle: "Next Position",
            description: `Takes approximately ${path.yearsToProgress || 2}-${(path.yearsToProgress || 2) + 1} years to progress`,
            timeEstimate: `${path.yearsToProgress || 2} years`,
            keySkills: path.skillsToAcquire || []
          });
        }
        
        // Sample resources based on skills to acquire
        const resources: PathResource[] = (path.skillsToAcquire || []).slice(0, 2).map(skill => ({
          title: `Master ${skill}`,
          provider: "Upcraft Learning",
          type: "Course",
          url: "#"
        }));
        
        // Add the UI-specific fields to the path
        path.pathSteps = pathSteps;
        path.resources = resources;
      }
      
      return path;
    },
    enabled: !!roleId,
  });

  // If the career path doesn't exist, render a message
  if (!isLoading && !error && !careerPath) {
    return (
      <Alert>
        <AlertTitle>No Career Path Available</AlertTitle>
        <AlertDescription>
          We don't have a career progression path for this role yet.
        </AlertDescription>
      </Alert>
    );
  }

  // If there's an error, render an error message
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load career path information. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Career Progression Path</h3>
      
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-4">
          {careerPath?.pathSteps && (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-7 top-6 bottom-10 w-0.5 bg-gradient-to-b from-primary/70 to-primary/30"></div>
              
              {/* Path steps */}
              {careerPath.pathSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 relative pb-8">
                  {/* Circle on timeline */}
                  <div className="w-14 h-14 rounded-full bg-background border-2 border-primary/50 flex items-center justify-center z-10 shadow-md">
                    {index === 0 ? (
                      <Trophy className="h-7 w-7 text-primary" />
                    ) : index === careerPath.pathSteps.length - 1 ? (
                      <Award className="h-7 w-7 text-primary" />
                    ) : (
                      <Zap className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  
                  {/* Step content card */}
                  <Card className={`flex-1 transition-all ${index === 0 ? 'border-primary/40' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{step.title}</CardTitle>
                        <Badge variant={index === 0 ? "default" : "outline"}>
                          {step.timeEstimate}
                        </Badge>
                      </div>
                      <CardDescription>{step.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {step.keySkills.map((skill, idx) => (
                          <li key={idx}>{skill}</li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </CardFooter>
                  </Card>
                </div>
              ))}
            </div>
          )}
          
          {careerPath?.resources && careerPath.resources.length > 0 && (
            <div className="pt-4">
              <h4 className="text-lg font-medium mb-2">Recommended Resources</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {careerPath.resources.map((resource, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="p-4">
                      <h5 className="font-medium">{resource.title}</h5>
                      <p className="text-sm text-muted-foreground">{resource.provider}</p>
                      <div className="mt-2 flex justify-between">
                        <Badge variant="outline">{resource.type}</Badge>
                        <Button size="sm" variant="ghost" className="h-8 gap-1" asChild>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            View <ChevronRight className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4">
    <div className="relative">
      <div className="absolute left-7 top-6 bottom-10 w-0.5 bg-gray-200"></div>
      
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4 relative pb-8">
          <Skeleton className="w-14 h-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CareerPathComponent;