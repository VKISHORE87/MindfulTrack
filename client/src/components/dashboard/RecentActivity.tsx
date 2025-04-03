import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ActivityCard from "@/components/ui/ActivityCard";
import { UserActivity } from "@shared/schema";

interface RecentActivityProps {
  activities: UserActivity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="mt-8 mb-6">
      <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
      
      <Card>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activityType={activity.activityType}
              description={activity.description}
              createdAt={activity.createdAt}
            />
          ))
        ) : (
          <CardContent className="py-6 text-center text-gray-500">
            No recent activities to display
          </CardContent>
        )}
      </Card>
    </div>
  );
}
