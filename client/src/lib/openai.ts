import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper function to safely parse OpenAI response
function safeJsonParse(content: string | null): any {
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    return {};
  }
}

export interface UserData {
  skills: Array<{
    id: number;
    name: string;
    category: string;
    currentLevel: number;
    targetLevel: number;
  }>;
  careerGoals: Array<{
    id: number;
    title: string;
    description?: string;
    timelineMonths: number;
  }>;
  learningHistory?: Array<{
    resourceId: number;
    title: string;
    completed: boolean;
    score?: number;
    timeSpent?: number;
  }>;
  learningPreferences?: {
    preferredStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
    availableTimeBlocks?: number[];
    preferredResourceTypes?: string[];
  };
}

export interface SkillGapAnalysis {
  missingSkills: Array<{
    name: string;
    category: string;
    importance: number;
    recommendedLevel: number;
    description: string;
  }>;
  underdevelopedSkills: Array<{
    id: number;
    name: string;
    currentLevel: number;
    recommendedLevel: number;
    gap: number;
    priority: number;
    reasonForPriority: string;
  }>;
  industryTrends: Array<{
    trend: string;
    relevance: number;
    relatedSkills: string[];
  }>;
  summary: string;
}

export interface SkillGraphData {
  nodes: Array<{
    id: string;
    name: string;
    category: string;
    level: number;
    targetLevel?: number;
    type: 'current' | 'target' | 'recommended' | 'related';
    size: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    strength: number;
    type: 'prerequisite' | 'related' | 'leads-to';
  }>;
  clusters: Array<{
    name: string;
    skills: string[];
    relevanceToGoals: number;
  }>;
}

export interface LearningPath {
  title: string;
  description: string;
  estimatedTimeToCompletion: string;
  milestones: Array<{
    title: string;
    description: string;
    targetDate: string;
    skills: string[];
  }>;
  modules: Array<{
    id: number;
    title: string;
    description: string;
    estimatedHours: number;
    skills: string[];
    resources: Array<{
      id: number;
      title: string;
      type: string;
      url?: string;
      duration?: number;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>;
  }>;
}

export interface ResourceRecommendation {
  immediateResources: Array<{
    title: string;
    type: string;
    url?: string;
    description: string;
    duration: number;
    skillsAddressed: string[];
    priority: number;
    matchReason: string;
  }>;
  microLearning: Array<{
    title: string;
    type: string;
    duration: number;
    timeSlot: string;
    description: string;
    skillsAddressed: string[];
  }>;
  adaptedToStyle: boolean;
  recommendedLearningStyle: string;
}

export interface PredictiveCareerPath {
  careerTrajectory: Array<{
    role: string;
    timeframe: string;
    requiredSkills: Array<{
      name: string;
      importance: number;
    }>;
    potentialEmployers: string[];
    salary: {
      min: number;
      max: number;
      currency: string;
    };
    industryDemand: number;
  }>;
  emergingSkills: Array<{
    name: string;
    timeToRelevance: string;
    industryImportance: number;
    relatedTo: string[];
  }>;
  recommendations: string;
}

export interface AiCoachResponse {
  message: string;
  advice: string;
  encouragement: string;
  nextSteps: Array<{
    action: string;
    rationale: string;
    difficulty: number;
  }>;
  challengeQuestion?: string;
}

export interface LearningPatternAnalysis {
  optimalLearningTimes: Array<{
    dayOfWeek: string;
    timeRange: string;
    effectiveness: number;
  }>;
  contentTypeEffectiveness: Array<{
    type: string;
    effectiveness: number;
    recommendation: string;
  }>;
  learningSessionInsights: {
    optimalDuration: number;
    breakFrequency: number;
    focusMetrics: {
      averageSessionsBeforeFatigue: number;
      optimalDifficultyCurve: string;
    };
  };
  skillAcquisitionRate: {
    fastestForSkillTypes: Array<{
      category: string;
      rate: number;
      notes: string;
    }>;
    recommendations: string;
  };
}

export async function generateLearningPath(userData: UserData): Promise<LearningPath> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI career advisor that specializes in creating personalized learning paths based on users' skills and career goals. Create a structured learning path with modules and recommended resources."
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return safeJsonParse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating learning path with OpenAI:", error);
    throw new Error("Failed to generate learning path recommendation");
  }
}

export async function analyzeSkillGaps(userData: UserData): Promise<SkillGapAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI career advisor that specializes in identifying skill gaps based on users' current skills and career goals. Provide a detailed analysis of missing or underdeveloped skills."
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing skill gaps with OpenAI:", error);
    throw new Error("Failed to analyze skill gaps");
  }
}

export async function recommendResources(userData: UserData): Promise<ResourceRecommendation> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI advisor that specializes in recommending learning resources based on users' skill gaps and learning preferences. Provide tailored resource recommendations that match their learning style and available time blocks."
        },
        {
          role: "user",
          content: JSON.stringify(userData)
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error recommending resources with OpenAI:", error);
    throw new Error("Failed to generate resource recommendations");
  }
}

export async function generateSkillGraph(userData: UserData): Promise<SkillGraphData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI data visualization specialist. Create a skill graph representation showing connections between skills, gaps, and industry relationships. The output should be structured for visualization with nodes and edges."
        },
        {
          role: "user",
          content: `Generate a skill graph for visualization based on this user data: ${JSON.stringify(userData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating skill graph with OpenAI:", error);
    throw new Error("Failed to generate skill graph visualization data");
  }
}

export async function predictCareerPath(userData: UserData): Promise<PredictiveCareerPath> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI career prediction specialist. Analyze the user's current skills and career goals to forecast potential career trajectories, emerging skills, and optimal career moves. Provide detailed predictions based on current industry trends."
        },
        {
          role: "user",
          content: `Predict optimal career paths and emerging skills based on this user profile: ${JSON.stringify(userData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error predicting career path with OpenAI:", error);
    throw new Error("Failed to generate career predictions");
  }
}

export async function getAiCoachGuidance(
  userData: UserData, 
  currentActivity: string, 
  currentChallenge?: string
): Promise<AiCoachResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an empathetic AI learning coach that provides personalized guidance, encouragement, and constructive feedback. Adapt your tone to be supportive yet challenging based on the user's current activity and challenges."
        },
        {
          role: "user",
          content: `Provide coaching guidance for this activity: "${currentActivity}". The user is facing this challenge: "${currentChallenge || 'No specific challenge mentioned'}". User profile: ${JSON.stringify(userData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error getting AI coach guidance with OpenAI:", error);
    throw new Error("Failed to generate coaching guidance");
  }
}

export async function analyzeLearningPatterns(
  userData: UserData,
  learningSessionsData: Array<{
    date: string;
    startTime: string;
    duration: number;
    resourceType: string;
    skillCategory: string;
    completionRate: number;
    assessmentScore?: number;
  }>
): Promise<LearningPatternAnalysis> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI learning patterns analyst. Analyze the user's learning session data to identify optimal learning times, content type effectiveness, and skill acquisition patterns. Provide actionable insights for optimizing their learning strategy."
        },
        {
          role: "user",
          content: `Analyze these learning patterns: ${JSON.stringify(learningSessionsData)} for user: ${JSON.stringify(userData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing learning patterns with OpenAI:", error);
    throw new Error("Failed to analyze learning patterns");
  }
}

export async function detectLearningStyle(
  userData: UserData,
  learningInteractions: Array<{
    resourceType: string;
    engagementMetrics: {
      timeSpent: number;
      completionRate: number;
      revisitFrequency: number;
      assessmentPerformance?: number;
    }
  }>
): Promise<{
  primaryStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  secondaryStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  styleProfile: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  recommendations: Array<{
    style: string;
    resourceTypes: string[];
    learningStrategies: string[];
  }>;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI learning style detection specialist. Analyze the user's learning interactions to determine their primary and secondary learning styles (visual, auditory, reading, kinesthetic). Provide a detailed profile and recommendations for optimizing their learning experience."
        },
        {
          role: "user",
          content: `Detect learning style from these interactions: ${JSON.stringify(learningInteractions)} for user: ${JSON.stringify(userData)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error detecting learning style with OpenAI:", error);
    throw new Error("Failed to detect learning style");
  }
}
