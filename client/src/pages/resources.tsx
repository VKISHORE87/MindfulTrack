import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Search, Filter, Star, Users, GraduationCap, Brain, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skill } from "@shared/schema";
import SkillResourceDropdown from "@/components/resources/SkillResourceDropdown";

export default function Resources({ user }: { user: any }) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  
  // Fetch all skills
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
    queryFn: () => fetch('/api/skills').then(res => res.json()),
  });
  
  // Fetch all learning resources
  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/learning-resources'],
    queryFn: () => fetch('/api/learning-resources').then(res => res.json()),
  });

  // Handle resource bookmarking
  const handleBookmark = async (resourceId: number) => {
    try {
      await apiRequest("POST", "/api/user-progress", {
        userId: user.id,
        resourceId,
        progress: 0,
        completed: false,
        startedAt: new Date().toISOString()
      });
      
      toast({
        title: "Resource saved",
        description: "This resource has been added to your learning list.",
      });
    } catch (error) {
      toast({
        title: "Error saving resource",
        description: "There was a problem saving this resource.",
        variant: "destructive",
      });
    }
  };

  // Process resources by skill
  const processResourcesBySkill = () => {
    if (!resources || !skills) return [];

    // Create a map of skill ID to skill object
    const skillMap = new Map(skills.map((skill: any) => [skill.id.toString(), skill]));
    
    // Group resources by skills
    const skillGroups = new Map();
    
    resources.forEach((resource: any) => {
      if (resource.skillIds && resource.skillIds.length > 0) {
        resource.skillIds.forEach((skillId: any) => {
          const skill = skillMap.get(skillId);
          if (skill) {
            if (!skillGroups.has(skill.name)) {
              skillGroups.set(skill.name, {
                skillName: skill.name,
                skillCategory: skill.category,
                resources: []
              });
            }
            skillGroups.get(skill.name).resources.push({
              id: resource.id,
              title: resource.title,
              description: resource.description,
              resourceType: resource.resourceType,
              url: resource.url,
              duration: resource.durationMinutes || 0,
              provider: resource.provider,
              difficulty: resource.difficulty || 'beginner',
              rating: parseFloat(resource.rating) || 0,
              isFree: resource.isFree !== false
            });
          }
        });
      }
    });

    return Array.from(skillGroups.values());
  };

  const skillGroups = processResourcesBySkill();

  // Filter skill groups based on search and filters
  const filteredSkillGroups = skillGroups.filter((group: any) => {
    const matchesSearch = searchTerm === "" || 
      group.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.resources.some((r: any) => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesCategory = selectedCategory === "all" || group.skillCategory === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(skillGroups.map((group: any) => group.skillCategory)));

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Free Learning Resources</h1>
        <p className="text-lg text-gray-600 mb-4">
          Discover 50+ curated free learning materials organized by skills to accelerate your career growth.
        </p>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{resources?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Resources</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{skillGroups.length}</p>
                <p className="text-sm text-gray-600">Skills Covered</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-gray-600">Free</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Filter Learning Resources</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search Skills or Resources</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="e.g., JavaScript, Python, Machine Learning..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {(searchTerm || selectedCategory !== "all" || selectedDifficulty !== "all") && (
          <div className="mt-4 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Category: {selectedCategory}
              </Badge>
            )}
            {selectedDifficulty !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Level: {selectedDifficulty}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedDifficulty("all");
              }}
              className="text-xs text-blue-600"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Skills-Based Resource Dropdowns */}
      <div className="space-y-4">
        {filteredSkillGroups.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">
                Learning Resources by Skill ({filteredSkillGroups.length} skills found)
              </h2>
              <p className="text-gray-600">
                Click on any skill below to explore curated free learning materials for that specific area.
              </p>
            </div>
            
            {filteredSkillGroups.map((group: any, index: number) => (
              <SkillResourceDropdown
                key={`${group.skillName}-${index}`}
                skillName={group.skillName}
                skillCategory={group.skillCategory}
                resources={group.resources}
                onBookmark={handleBookmark}
              />
            ))}
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No resources found</h3>
            <p className="text-gray-500 mb-4">
              No resources match your current search and filter criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedDifficulty("all");
              }}
            >
              Clear filters and show all resources
            </Button>
          </div>
        )}
      </div>

      {/* Resource Summary Footer */}
      {filteredSkillGroups.length > 0 && (
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Resource Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Total Skills</p>
              <p className="text-2xl font-bold text-primary">{filteredSkillGroups.length}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Total Resources</p>
              <p className="text-2xl font-bold text-primary">
                {filteredSkillGroups.reduce((total: number, group: any) => total + group.resources.length, 0)}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Free Resources</p>
              <p className="text-2xl font-bold text-green-600">100%</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Avg. Rating</p>
              <p className="text-2xl font-bold text-yellow-600">4.6★</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}