import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, FileText } from "lucide-react";

interface Resource {
  id: number;
  completed: boolean;
}

interface LearningResource {
  id: number;
  title: string;
  description: string;
  resourceType: string;
  duration: number;
}

interface LearningPathCardProps {
  moduleNumber: number;
  title: string;
  estimatedHours: number;
  description: string;
  resources: Resource[];
  allResources: LearningResource[];
}

export default function LearningPathCard({
  moduleNumber,
  title,
  estimatedHours,
  description,
  resources,
  allResources
}: LearningPathCardProps) {
  // Find the actual resource data using the IDs from resources
  const resourceDetails = resources.map(res => {
    const detail = allResources.find(r => r.id === res.id);
    return {
      ...res,
      ...detail
    };
  });

  // Icon based on resource type
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'course':
      case 'video':
        return (
          <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
            <Video className="h-4 w-4 text-blue-600" />
          </div>
        );
      case 'workshop':
        return (
          <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
            <BookOpen className="h-4 w-4 text-purple-600" />
          </div>
        );
      case 'assessment':
        return (
          <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
            <FileText className="h-4 w-4 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
            <BookOpen className="h-4 w-4 text-gray-600" />
          </div>
        );
    }
  };

  // Badge color based on resource type
  const getResourceBadgeStyle = (resourceType: string) => {
    switch (resourceType) {
      case 'course':
      case 'video':
        return 'bg-blue-100 text-blue-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'assessment':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative mb-8 last:mb-0">
      <div className="path-connector absolute top-10 left-5 w-0.5 h-[calc(100%-40px)] bg-gray-200 z-0"></div>
      
      <div className="relative z-10 flex">
        <div 
          className={`${
            resources.some(r => r.completed) 
              ? 'bg-primary text-white' 
              : 'bg-gray-300 text-gray-700'
          } rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0`}
        >
          {moduleNumber}
        </div>
        
        <div className="ml-4 w-full">
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-gray-500 mb-3">Estimated time: {estimatedHours} hours</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {resourceDetails.map((resource) => (
              <Card 
                key={resource.id}
                className={`${
                  resource.completed 
                    ? 'border-primary-300 bg-gray-50' 
                    : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-gray-100 transition-colors'
                } ${resource.completed ? '' : 'opacity-60'}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    {getResourceIcon(resource.resourceType)}
                    <h5 className="font-medium text-sm">{resource.title}</h5>
                  </div>
                  <p className="text-xs text-gray-500">{resource.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="outline" className={getResourceBadgeStyle(resource.resourceType)}>
                      {resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {resource.duration ? `${(resource.duration / 60).toFixed(1)} hours` : '1 hour'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
