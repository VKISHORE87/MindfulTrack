import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import { ChevronRight, BarChart2, CheckCircle, AlertTriangle } from "lucide-react";

interface CareerGoalProps {
  id: number;
  title: string;
  timeline: string;
  readiness: number;
}

export default function CareerGoals({ id, title, timeline, readiness }: CareerGoalProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <h3 className="text-lg font-bold">Career Goal</h3>
        <p className="text-sm text-gray-500">Your current progress toward target role</p>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center mb-6">
          <div className="bg-gray-100 p-3 rounded-full">
            <BarChart2 className="h-8 w-8 text-primary" />
          </div>
          <div className="ml-4">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-gray-500">{timeline}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Overall readiness</span>
            <span className="text-sm font-medium">{readiness}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary h-2.5 rounded-full" 
              style={{ width: `${readiness}%` }}
            ></div>
          </div>
          
          <div className="mt-6 space-y-2">
            {readiness >= 70 && (
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-emerald-500 mr-2 flex-shrink-0" />
                <p className="text-sm">Strong digital marketing foundation</p>
              </div>
            )}
            
            {readiness < 50 && (
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-sm">Need stronger data analysis skills</p>
              </div>
            )}
            
            {readiness < 60 && (
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-sm">Develop marketing analytics expertise</p>
              </div>
            )}
          </div>
          
          <div className="mt-6">
            <Link href="/assessment">
              <a className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
                Update career goal
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
