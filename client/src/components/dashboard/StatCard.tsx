import { Card } from "@/components/ui/card";
import { BarChart2, CheckCircle, Clock, BookOpen } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  type: 'progress' | 'validated' | 'time' | 'resources';
}

export default function StatCard({ title, value, type }: StatCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'progress':
        return (
          <div className="p-3 rounded-full bg-primary-100 text-primary mr-4">
            <BarChart2 className="h-6 w-6" />
          </div>
        );
      case 'validated':
        return (
          <div className="p-3 rounded-full bg-green-100 text-emerald-500 mr-4">
            <CheckCircle className="h-6 w-6" />
          </div>
        );
      case 'time':
        return (
          <div className="p-3 rounded-full bg-amber-100 text-amber-500 mr-4">
            <Clock className="h-6 w-6" />
          </div>
        );
      case 'resources':
        return (
          <div className="p-3 rounded-full bg-indigo-100 text-primary mr-4">
            <BookOpen className="h-6 w-6" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6 flex items-center">
      {getIcon()}
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
