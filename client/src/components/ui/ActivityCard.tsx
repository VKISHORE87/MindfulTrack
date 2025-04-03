import { formatDistanceToNow } from "date-fns";
import { Check, BookOpen, Edit, Award } from "lucide-react";

interface ActivityCardProps {
  activityType: string;
  description: string;
  createdAt: Date;
}

export default function ActivityCard({ 
  activityType, 
  description, 
  createdAt 
}: ActivityCardProps) {
  // Get the appropriate icon based on activity type
  const getActivityIcon = () => {
    switch (activityType) {
      case 'completed_resource':
        return (
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Check className="h-5 w-5 text-primary-600" />
          </div>
        );
      case 'started_resource':
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
        );
      case 'updated_skill':
        return (
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Edit className="h-5 w-5 text-purple-600" />
          </div>
        );
      case 'validated_skill':
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Award className="h-5 w-5 text-green-600" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-gray-600" />
          </div>
        );
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 last:border-0 hover:bg-gray-50">
      <div className="flex">
        {getActivityIcon()}
        <div className="ml-4">
          <h4 className="font-medium text-sm">{description}</h4>
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}
