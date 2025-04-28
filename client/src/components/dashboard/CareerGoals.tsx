import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  ChevronRight, 
  BarChart2, 
  CheckCircle, 
  AlertTriangle,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  BarChart4
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CareerGoalProps {
  id: number;
  title: string;
  timeline: string;
  readiness: number;
}

export default function CareerGoals({ id, title, timeline, readiness }: CareerGoalProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-1">My Career Goal</h2>
            <p className="text-gray-600">Your journey toward your target role</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-3">
            <Link href="/career-transitions?tab=career-goals">
              <Button variant="outline" size="sm">
                Update Goal
              </Button>
            </Link>
            <Link href="/career-transitions">
              <Button variant="default" size="sm">
                Explore Career Options
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold">{title}</h3>
                <p className="text-gray-600">{timeline}</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Overall readiness</span>
                <span className="font-medium">{readiness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div 
                  className="bg-primary h-3 rounded-full" 
                  style={{ width: `${readiness}%` }}
                ></div>
              </div>
              
              <div className="space-y-4 mt-6">
                {readiness >= 70 && (
                  <div className="flex items-start p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-700">Strong foundation</p>
                      <p className="text-sm text-emerald-600">You have solid digital marketing skills</p>
                    </div>
                  </div>
                )}
                
                {readiness < 50 && (
                  <div className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700">Development area</p>
                      <p className="text-sm text-amber-600">Need stronger data analysis skills</p>
                    </div>
                  </div>
                )}
                
                {readiness < 60 && (
                  <div className="flex items-start p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-700">Development area</p>
                      <p className="text-sm text-amber-600">Develop marketing analytics expertise</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium mb-4">Pathway to Success</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium">Key Skills to Develop</h4>
                </div>
                <ul className="space-y-2 pl-10">
                  <li className="text-sm text-gray-600">Advanced data analysis</li>
                  <li className="text-sm text-gray-600">Marketing automation</li>
                  <li className="text-sm text-gray-600">SEO optimization</li>
                  <li className="text-sm text-gray-600">Content strategy</li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium">Market Outlook</h4>
                </div>
                <div className="space-y-3 pl-10">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Job Growth</span>
                      <span className="text-sm font-medium">15%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Demand</span>
                      <span className="text-sm font-medium">High</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium">Estimated Timeline</h4>
                </div>
                <div className="pl-10">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-primary text-white">
                          Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-primary">
                          {readiness}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                      <div style={{ width: `${readiness}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Start</span>
                      <span>6 months</span>
                      <span>{timeline}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <BarChart4 className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium">Skill Gap Analysis</h4>
                </div>
                <div className="pl-10">
                  <Link href="/career-transitions">
                    <a className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
                      View detailed skill gap analysis
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-gray-500">Updated 3 days ago</div>
        <div>
          <Link href="/career-transitions">
            <a className="text-sm font-medium text-primary hover:text-primary-800 flex items-center">
              Explore alternative career paths
              <ChevronRight className="h-4 w-4 ml-1" />
            </a>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
