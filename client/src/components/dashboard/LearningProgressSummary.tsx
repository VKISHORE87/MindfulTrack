import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ChevronRight, BookOpen, CheckCircle, Clock, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

interface ResourceItem {
  id: number;
  title: string;
  progress?: number;
  completed?: boolean;
  dueDate?: string;
  type?: string;
}

interface LearningProgressSummaryProps {
  completedCount?: number;
  totalCount?: number;
  resources?: ResourceItem[];
  maxDisplayed?: number;
}

export default function LearningProgressSummary({
  completedCount = 0,
  totalCount = 0,
  resources = [],
  maxDisplayed = 3
}: LearningProgressSummaryProps) {
  // Limit the number of resources displayed
  const displayResources = resources.slice(0, maxDisplayed);
  
  // Calculate completion percentage
  const completionPercentage = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;
  
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-semibold text-lg">Learning Progress</h3>
          </div>
          <div className="text-sm text-gray-500">
            {completedCount} of {totalCount} completed
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {/* Overall Progress Bar */}
          <div>
            <Progress value={completionPercentage} className="h-2.5 mb-1" />
            <div className="text-xs text-gray-500 text-right">
              {completionPercentage}% complete
            </div>
          </div>
          
          {/* Resource List */}
          {displayResources.length > 0 ? (
            <div className="space-y-3">
              {displayResources.map((resource, index) => (
                <div key={index} className="group">
                  <Link href={`/resources/${resource.id}`}>
                    <div className="flex items-start p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer transition-colors">
                      <div className="flex-grow">
                        <div className="flex items-center">
                          {resource.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                          )}
                          <p className="font-medium text-gray-800 group-hover:text-primary transition-colors">
                            {resource.title}
                          </p>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <div className="mr-3">
                            {resource.type || "Course"}
                          </div>
                          {resource.progress !== undefined && !resource.completed && (
                            <div className="mr-3">
                              {resource.progress}% complete
                            </div>
                          )}
                          {resource.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {resource.dueDate}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-2 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <p className="text-gray-600">
                No learning resources in progress
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link href="/resources" className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
          View all learning resources
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
}