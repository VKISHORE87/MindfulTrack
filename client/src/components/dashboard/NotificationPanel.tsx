import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Bell, BookOpen, Award, Calendar, LucideIcon, Zap, Target } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'milestone' | 'resource' | 'achievement' | 'opportunity' | 'reminder';
  read: boolean;
  date: string;
  link?: string;
}

interface NotificationPanelProps {
  notifications?: Notification[];
}

export default function NotificationPanel({ notifications = [] }: NotificationPanelProps) {
  const defaultNotifications: Notification[] = [
    {
      id: '1',
      title: 'Achievement Unlocked',
      message: 'You completed your Technical Documentation skill assessment',
      type: 'achievement',
      read: false,
      date: '2 hours ago',
      link: '/assessment'
    },
    {
      id: '2',
      title: 'New Recommended Resource',
      message: 'System Design Fundamentals course matches your skill gap',
      type: 'resource',
      read: false,
      date: 'Yesterday',
      link: '/resources'
    },
    {
      id: '3',
      title: 'Upcoming Milestone',
      message: 'You are 75% of the way to your career goal',
      type: 'milestone',
      read: true,
      date: '2 days ago',
      link: '/progress'
    },
    {
      id: '4',
      title: 'Career Opportunity',
      message: 'New intermediate roles available in your field',
      type: 'opportunity',
      read: true,
      date: '1 week ago',
      link: '/career-transitions'
    }
  ];
  
  const [notificationList, setNotificationList] = useState<Notification[]>(
    notifications.length > 0 ? notifications : defaultNotifications
  );
  
  const markAsRead = (id: string) => {
    setNotificationList(notifications => 
      notifications.map(note => 
        note.id === id ? { ...note, read: true } : note
      )
    );
  };

  // Icon mapping based on notification type
  const getIcon = (type: string): LucideIcon => {
    switch(type) {
      case 'milestone': return Zap;
      case 'resource': return BookOpen;
      case 'achievement': return Award;
      case 'opportunity': return Target;
      case 'reminder': return Calendar;
      default: return Bell;
    }
  };
  
  // Get background color based on notification type
  const getBackgroundColor = (type: string, read: boolean): string => {
    if (read) return 'bg-gray-50';
    
    switch(type) {
      case 'milestone': return 'bg-blue-50';
      case 'resource': return 'bg-emerald-50';
      case 'achievement': return 'bg-purple-50';
      case 'opportunity': return 'bg-amber-50';
      case 'reminder': return 'bg-gray-50';
      default: return 'bg-gray-50';
    }
  };

  const unreadCount = notificationList.filter(n => !n.read).length;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-primary mr-2" />
            <h3 className="font-semibold text-lg">Notifications</h3>
          </div>
          {unreadCount > 0 && (
            <div className="bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {unreadCount} new
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notificationList.length > 0 ? (
          <div className="space-y-3">
            {notificationList.map((notification) => {
              const Icon = getIcon(notification.type);
              const bgColor = getBackgroundColor(notification.type, notification.read);
              
              return (
                <div 
                  key={notification.id} 
                  className={`relative rounded-lg border transition-colors ${bgColor} ${notification.read ? 'opacity-75' : 'border-primary/10'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {!notification.read && (
                    <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary"></div>
                  )}
                  <Link href={notification.link || '#'}>
                    <div className="p-3 cursor-pointer">
                      <div className="flex">
                        <div className="mr-3 flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm mb-1">{notification.title}</p>
                          <p className="text-xs text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No notifications</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}