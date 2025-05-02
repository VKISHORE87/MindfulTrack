import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LearningPathCard from "@/components/ui/LearningPathCard";
import { Link } from "wouter";
import { Module, LearningResource } from "@/types/learning";

interface LearningPathProps {
  title: string;
  modules: Module[];
  resources: LearningResource[];
}

export default function LearningPath({ title, modules, resources }: LearningPathProps) {
  // Create safe versions of the data with fallbacks
  const safeModules = Array.isArray(modules) ? modules : [];
  const safeResources = Array.isArray(resources) ? resources : [];
  
  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-6">Your Recommended Learning Path</h3>
      
      <Card>
        <CardContent className="p-6">
          {safeModules.length > 0 ? (
            safeModules.map((module, index) => (
              <LearningPathCard
                key={module.id || index}
                moduleNumber={index + 1}
                title={module.title || `Module ${index + 1}`}
                estimatedHours={module.estimatedHours || 0}
                description={module.description || 'No description available'}
                resources={Array.isArray(module.resources) ? module.resources : []}
                allResources={safeResources}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No learning path modules available yet. 
              <br />
              <Link href="/learning-path">
                <span className="text-primary hover:underline cursor-pointer">
                  Generate a learning path
                </span>
              </Link>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Link href="/learning-path">
              <Button className="bg-primary hover:bg-primary-700">
                View full learning path
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
