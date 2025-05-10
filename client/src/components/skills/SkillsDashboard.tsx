import React, { useState, useEffect } from 'react';
import { useSkills } from '@/contexts/SkillsContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useCareerGoal } from '@/contexts/CareerGoalContext';
import { SkillEditorComponent } from './SkillEditorComponent';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Search, 
  Filter, 
  SortAsc, 
  Loader2, 
  BarChart as BarChartIcon, 
  List, 
  Edit, 
  Star,
  Award,
  TrendingUp
} from 'lucide-react';

interface SkillsDashboardProps {
  userId: number;
}

export const SkillsDashboard: React.FC<SkillsDashboardProps> = ({
  userId
}) => {
  const { skills, isLoading, error } = useSkills();
  const { progressData } = useProgress();
  const { currentGoal, targetRoleSkills } = useCareerGoal();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'progress'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSkillId, setSelectedSkillId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('table');

  // Extract unique categories from skills
  const categories = skills 
    ? Array.from(new Set(skills.map(skill => skill.category)))
    : [];

  // Filter and sort skills based on user selections
  const filteredAndSortedSkills = skills
    ? skills
        .filter(skill => 
          (searchQuery === '' || skill.skillName.toLowerCase().includes(searchQuery.toLowerCase())) &&
          (selectedCategory === null || skill.category === selectedCategory)
        )
        .sort((a, b) => {
          if (sortBy === 'name') {
            return sortDirection === 'asc'
              ? a.skillName.localeCompare(b.skillName)
              : b.skillName.localeCompare(a.skillName);
          } else if (sortBy === 'level') {
            return sortDirection === 'asc'
              ? a.currentLevel - b.currentLevel
              : b.currentLevel - a.currentLevel;
          } else {
            // Get progress percentage for these skills
            const aProgress = progressData?.skills.find(s => s.skillId === a.skillId)?.percent || 0;
            const bProgress = progressData?.skills.find(s => s.skillId === b.skillId)?.percent || 0;
            return sortDirection === 'asc'
              ? aProgress - bProgress
              : bProgress - aProgress;
          }
        })
    : [];

  // Generate chart data
  const chartData = skills
    ? skills
        .filter(skill => 
          selectedCategory === null || skill.category === selectedCategory
        )
        .map(skill => {
          const progressPercent = progressData?.skills.find(s => s.skillId === skill.skillId)?.percent || 0;
          return {
            name: skill.skillName,
            currentLevel: skill.currentLevel,
            targetLevel: skill.targetLevel,
            progress: progressPercent,
            gap: skill.targetLevel - skill.currentLevel,
          };
        })
    : [];

  // Group skills by category for the overview
  const skillsByCategory = skills
    ? categories.map(category => {
        const categorySkills = skills.filter(skill => skill.category === category);
        const totalCurrentLevel = categorySkills.reduce((sum, skill) => sum + skill.currentLevel, 0);
        const totalTargetLevel = categorySkills.reduce((sum, skill) => sum + skill.targetLevel, 0);
        const avgProgress = categorySkills.reduce((sum, skill) => {
          const progressPercent = progressData?.skills.find(s => s.skillId === skill.skillId)?.percent || 0;
          return sum + progressPercent;
        }, 0) / categorySkills.length;
        
        return {
          category,
          skills: categorySkills,
          avgCurrentLevel: totalCurrentLevel / categorySkills.length,
          avgTargetLevel: totalTargetLevel / categorySkills.length,
          avgProgress,
          count: categorySkills.length
        };
      })
    : [];

  // Find the selected skill
  const selectedSkill = selectedSkillId ? skills?.find(skill => skill.skillId === selectedSkillId) : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading skills: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Skills Available</CardTitle>
          <CardDescription>
            You haven't added any skills to your profile yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Complete a skill assessment to add skills to your profile.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.href = '/assessment'}>
            Take Skill Assessment
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View selection tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3">
          <TabsTrigger value="table" className="flex items-center gap-1">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List View</span>
          </TabsTrigger>
          <TabsTrigger value="chart" className="flex items-center gap-1">
            <BarChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Chart View</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Filters for all tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal text-muted-foreground">Category:</Label>
            </div>
            
            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-normal text-muted-foreground">Sort by:</Label>
            </div>
            
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [newSortBy, newSortDirection] = e.target.value.split('-');
                setSortBy(newSortBy as 'name' | 'level' | 'progress');
                setSortDirection(newSortDirection as 'asc' | 'desc');
              }}
              className="px-2 py-1 border rounded-md text-sm"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="level-desc">Level (High-Low)</option>
              <option value="level-asc">Level (Low-High)</option>
              <option value="progress-desc">Progress (High-Low)</option>
              <option value="progress-asc">Progress (Low-High)</option>
            </select>
          </div>
        </div>
        
        <TabsContent value="table" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left side: Skills list */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Skills</h3>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredAndSortedSkills.map(skill => {
                  const progressPercent = progressData?.skills.find(s => s.skillId === skill.skillId)?.percent || 0;
                  
                  return (
                    <Card 
                      key={skill.skillId} 
                      className={`cursor-pointer transition-colors ${selectedSkillId === skill.skillId ? 'border-primary' : ''}`}
                      onClick={() => setSelectedSkillId(skill.skillId)}
                    >
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{skill.skillName}</CardTitle>
                            <CardDescription className="text-xs">
                              Category: {skill.category}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="bg-muted/30">
                            Level {skill.currentLevel}/{skill.targetLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="py-0">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span>Progress</span>
                            <span>{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-1" />
                        </div>
                      </CardContent>
                      
                      <CardFooter className="py-2 flex justify-end">
                        <Button variant="ghost" size="sm" className="gap-1 h-7">
                          <Edit className="h-3 w-3" />
                          <span className="text-xs">Edit</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
                
                {filteredAndSortedSkills.length === 0 && (
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-muted-foreground">No skills match your filters</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Right side: Skill editor */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Skill Details</h3>
              
              {selectedSkillId ? (
                <SkillEditorComponent 
                  skillId={selectedSkillId} 
                  selectedSkill={selectedSkill || undefined}
                  onSkillUpdate={() => {
                    // Refresh data if needed
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                    <Edit className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Select a skill to view and edit details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Skills Visualization</CardTitle>
              <CardDescription>
                Visual representation of your current skill levels, target levels, and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      tick={{ fontSize: 12 }} 
                      height={80} 
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="currentLevel" name="Current Level" fill="#a78bfa" />
                    <Bar dataKey="targetLevel" name="Target Level" fill="#60a5fa" />
                    <Bar dataKey="progress" name="Progress %" fill="#34d399" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Summary card */}
            <Card>
              <CardHeader>
                <CardTitle>Skills Summary</CardTitle>
                <CardDescription>Overview of your skill profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold">{skills.length}</span>
                      <span className="text-sm text-muted-foreground">Total Skills</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold">{categories.length}</span>
                      <span className="text-sm text-muted-foreground">Skill Categories</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold">
                        {Math.round(skills.reduce((sum, skill) => sum + skill.currentLevel, 0) / skills.length * 10) / 10}
                      </span>
                      <span className="text-sm text-muted-foreground">Avg Current Level</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg flex flex-col items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold">
                        {Math.round(
                          (progressData?.skills.reduce((sum, skill) => sum + skill.percent, 0) || 0) / 
                          (progressData?.skills.length || 1)
                        )}%
                      </span>
                      <span className="text-sm text-muted-foreground">Avg Progress</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Skills by category */}
            <Accordion type="multiple" defaultValue={categories}>
              {skillsByCategory.map(category => (
                <AccordionItem key={category.category} value={category.category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="bg-muted/30">
                          {category.count} skills
                        </Badge>
                        <Progress value={category.avgProgress} className="w-[100px] h-2" />
                        <span className="text-sm">{Math.round(category.avgProgress)}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                      {category.skills.map(skill => {
                        const progressPercent = progressData?.skills.find(s => s.skillId === skill.skillId)?.percent || 0;
                        
                        return (
                          <Card 
                            key={skill.skillId} 
                            className="overflow-hidden cursor-pointer hover:border-primary transition-all"
                            onClick={() => {
                              setSelectedSkillId(skill.skillId);
                              setActiveTab('table');
                            }}
                          >
                            <div className="h-1 bg-primary" style={{ width: `${progressPercent}%` }} />
                            <CardHeader className="py-3">
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-sm">{skill.skillName}</CardTitle>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-3 w-3 ${i < skill.currentLevel ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="py-0">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Current: {skill.currentLevel}/5</span>
                                <span>Target: {skill.targetLevel}/5</span>
                              </div>
                            </CardContent>
                            <CardFooter className="py-2 flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Progress: {progressPercent}%</span>
                              <Button variant="ghost" size="sm" className="h-6 px-2">
                                <Edit className="h-3 w-3" />
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            
            {/* Target role skills */}
            {currentGoal && targetRoleSkills.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Target Skills for {currentGoal.title}
                      </CardTitle>
                      <CardDescription>
                        Skills required for your target role
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/career-transitions'}>
                      View Career Goal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {targetRoleSkills.map((skillName, index) => {
                      // Find if the user has this skill
                      const userHasSkill = skills.some(s => 
                        s.skillName.toLowerCase() === skillName.toLowerCase()
                      );
                      
                      return (
                        <Badge 
                          key={index} 
                          variant={userHasSkill ? "default" : "outline"}
                          className={userHasSkill ? "" : "border-dashed"}
                        >
                          {skillName}
                          {!userHasSkill && " (Missing)"}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};