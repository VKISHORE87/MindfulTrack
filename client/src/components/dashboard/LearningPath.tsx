import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LearningPathCard from "@/components/ui/LearningPathCard";
import { Link } from "wouter";

interface Resource {
  id: number;
  completed: boolean;
}

interface Module {
  id: number;
  title: string;
  description: string;
  estimatedHours: number;
  resources: Resource[];
}

interface LearningResource {
  id: number;
  title: string;
  description: string;
  resourceType: string;
  duration: number;
}

interface LearningPathProps {
  title: string;
  modules: Module[];
  resources: LearningResource[];
}

export default function LearningPath({ title, modules, resources }: LearningPathProps) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-6">Your Recommended Learning Path</h3>
      
      <Card>
        <CardContent className="p-6">
          {modules.map((module, index) => (
            <LearningPathCard
              key={module.id}
              moduleNumber={index + 1}
              title={module.title}
              estimatedHours={module.estimatedHours}
              description={module.description}
              resources={module.resources}
              allResources={resources}
            />
          ))}
          
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
