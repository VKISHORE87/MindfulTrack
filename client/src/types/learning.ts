// Shared interfaces for learning components

export interface Resource {
  id: number;
  completed: boolean;
}

export interface LearningResource {
  id: number;
  title: string;
  description: string | null;
  resourceType: string;
  duration: number | null;
  url?: string | null;
  provider?: string | null;
  skillIds?: string[] | null;
  [key: string]: any; // Allow for additional properties to prevent type errors
}

export interface Module {
  id: number;
  title: string;
  description: string;
  estimatedHours: number;
  resources: Resource[];
}