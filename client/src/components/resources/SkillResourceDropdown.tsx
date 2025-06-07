import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Clock, ExternalLink, BookOpen, Video, FileText, Code, Book } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Resource {
  id: number;
  title: string;
  description: string;
  resourceType: string;
  url: string;
  duration: number;
  provider: string;
  difficulty: string;
  rating: number;
  isFree: boolean;
}

interface SkillResourceDropdownProps {
  skillName: string;
  skillCategory: string;
  resources: Resource[];
  onBookmark?: (resourceId: number) => void;
}

const SkillResourceDropdown: React.FC<SkillResourceDropdownProps> = ({
  skillName,
  skillCategory,
  resources,
  onBookmark
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Group resources by type
  const resourcesByType = resources.reduce((acc, resource) => {
    if (!acc[resource.resourceType]) {
      acc[resource.resourceType] = [];
    }
    acc[resource.resourceType].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  // Filter resources
  const filteredResources = resources.filter(resource => {
    const typeMatch = selectedType === 'all' || resource.resourceType === selectedType;
    const difficultyMatch = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
    return typeMatch && difficultyMatch;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      case 'documentation':
        return <FileText className="h-4 w-4" />;
      case 'practice':
        return <Code className="h-4 w-4" />;
      case 'book':
        return <Book className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const resourceTypes = ['all', ...Object.keys(resourcesByType)];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {skillName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{skillName}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {skillCategory}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {resources.length} free resource{resources.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right text-sm text-gray-500 mr-2">
                  <div className="flex items-center space-x-1">
                    {Object.entries(resourcesByType).map(([type, typeResources]) => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {type}: {typeResources.length}
                      </Badge>
                    ))}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Filters */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Type:</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {resourceTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Difficulty:</span>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="text-primary">
                        {getResourceIcon(resource.resourceType)}
                      </div>
                      <h4 className="font-medium text-sm line-clamp-2">{resource.title}</h4>
                    </div>
                    {resource.rating && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>{resource.rating}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {resource.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyColor(resource.difficulty)} variant="secondary">
                        {resource.difficulty}
                      </Badge>
                      {resource.duration && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(resource.duration)}</span>
                        </div>
                      )}
                    </div>
                    {resource.provider && (
                      <span className="text-xs text-gray-500">{resource.provider}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => window.open(resource.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Access Resource
                    </Button>
                    {onBookmark && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onBookmark(resource.id)}
                        className="text-xs"
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No resources found for the selected filters.</p>
                <p className="text-sm">Try adjusting your filter criteria.</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default SkillResourceDropdown;