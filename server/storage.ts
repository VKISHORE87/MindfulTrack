import {
  users, User, InsertUser,
  careerGoals, CareerGoal, InsertCareerGoal,
  skills, Skill, InsertSkill,
  userSkills, UserSkill, InsertUserSkill,
  learningResources, LearningResource, InsertLearningResource,
  learningPaths, LearningPath, InsertLearningPath,
  userProgress, UserProgress, InsertUserProgress,
  userActivities, UserActivity, InsertUserActivity,
  skillValidations, SkillValidation, InsertSkillValidation
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

// Comprehensive storage interface for all CRUD operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Career goal methods
  getCareerGoal(id: number): Promise<CareerGoal | undefined>;
  getCareerGoalsByUserId(userId: number): Promise<CareerGoal[]>;
  createCareerGoal(goal: InsertCareerGoal): Promise<CareerGoal>;
  updateCareerGoal(id: number, goalData: Partial<InsertCareerGoal>): Promise<CareerGoal | undefined>;
  deleteCareerGoal(id: number): Promise<boolean>;

  // Skill methods
  getSkill(id: number): Promise<Skill | undefined>;
  getAllSkills(): Promise<Skill[]>;
  getSkillsByCategory(category: string): Promise<Skill[]>;
  createSkill(skill: InsertSkill): Promise<Skill>;
  updateSkill(id: number, skillData: Partial<InsertSkill>): Promise<Skill | undefined>;
  deleteSkill(id: number): Promise<boolean>;

  // User skill methods
  getUserSkill(id: number): Promise<UserSkill | undefined>;
  getUserSkillsByUserId(userId: number): Promise<UserSkill[]>;
  getUserSkillsWithDetails(userId: number): Promise<(UserSkill & { skillName: string, category: string })[]>;
  createUserSkill(userSkill: InsertUserSkill): Promise<UserSkill>;
  updateUserSkill(id: number, userSkillData: Partial<InsertUserSkill>): Promise<UserSkill | undefined>;
  deleteUserSkill(id: number): Promise<boolean>;

  // Learning resource methods
  getLearningResource(id: number): Promise<LearningResource | undefined>;
  getAllLearningResources(): Promise<LearningResource[]>;
  getLearningResourcesByType(type: string): Promise<LearningResource[]>;
  getLearningResourcesBySkill(skillId: number): Promise<LearningResource[]>;
  createLearningResource(resource: InsertLearningResource): Promise<LearningResource>;
  updateLearningResource(id: number, resourceData: Partial<InsertLearningResource>): Promise<LearningResource | undefined>;
  deleteLearningResource(id: number): Promise<boolean>;

  // Learning path methods
  getLearningPath(id: number): Promise<LearningPath | undefined>;
  getLearningPathsByUserId(userId: number): Promise<LearningPath[]>;
  createLearningPath(path: InsertLearningPath): Promise<LearningPath>;
  updateLearningPath(id: number, pathData: Partial<InsertLearningPath>): Promise<LearningPath | undefined>;
  deleteLearningPath(id: number): Promise<boolean>;

  // User progress methods
  getUserProgress(id: number): Promise<UserProgress | undefined>;
  getUserProgressByUserId(userId: number): Promise<UserProgress[]>;
  getUserProgressByResource(userId: number, resourceId: number): Promise<UserProgress | undefined>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress | undefined>;
  deleteUserProgress(id: number): Promise<boolean>;

  // User activity methods
  getUserActivity(id: number): Promise<UserActivity | undefined>;
  getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  deleteUserActivity(id: number): Promise<boolean>;

  // Skill validation methods
  getSkillValidation(id: number): Promise<SkillValidation | undefined>;
  getSkillValidationsByUserId(userId: number): Promise<SkillValidation[]>;
  getSkillValidationsBySkill(skillId: number): Promise<SkillValidation[]>;
  createSkillValidation(validation: InsertSkillValidation): Promise<SkillValidation>;
  updateSkillValidation(id: number, validationData: Partial<InsertSkillValidation>): Promise<SkillValidation | undefined>;
  deleteSkillValidation(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private careerGoalsMap: Map<number, CareerGoal>;
  private skillsMap: Map<number, Skill>;
  private userSkillsMap: Map<number, UserSkill>;
  private learningResourcesMap: Map<number, LearningResource>;
  private learningPathsMap: Map<number, LearningPath>;
  private userProgressMap: Map<number, UserProgress>;
  private userActivitiesMap: Map<number, UserActivity>;
  private skillValidationsMap: Map<number, SkillValidation>;

  private currentUserID: number = 1;
  private currentCareerGoalID: number = 1;
  private currentSkillID: number = 1;
  private currentUserSkillID: number = 1;
  private currentLearningResourceID: number = 1;
  private currentLearningPathID: number = 1;
  private currentUserProgressID: number = 1;
  private currentUserActivityID: number = 1;
  private currentSkillValidationID: number = 1;

  constructor() {
    this.usersMap = new Map();
    this.careerGoalsMap = new Map();
    this.skillsMap = new Map();
    this.userSkillsMap = new Map();
    this.learningResourcesMap = new Map();
    this.learningPathsMap = new Map();
    this.userProgressMap = new Map();
    this.userActivitiesMap = new Map();
    this.skillValidationsMap = new Map();

    // Initialize with some seed data
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create default users
    const defaultUsers = [
      { username: 'rahul', password: 'password', name: 'Rahul Singh', role: 'Marketing Executive', email: 'rahul@example.com' },
      { username: 'priya', password: 'password', name: 'Priya Sharma', role: 'Software Developer', email: 'priya@example.com' },
      { username: 'ananya', password: 'password', name: 'Ananya Mehta', role: 'Finance Professional', email: 'ananya@example.com' }
    ];

    defaultUsers.forEach(user => this.createUser(user));

    // Create default skills
    const defaultSkills = [
      { name: 'Data Analysis', category: 'analytical', description: 'Ability to interpret data to inform decisions' },
      { name: 'Digital Marketing', category: 'technical', description: 'Knowledge of digital marketing platforms and strategies' },
      { name: 'Marketing Analytics', category: 'analytical', description: 'Using data to measure marketing performance' },
      { name: 'Content Strategy', category: 'creative', description: 'Planning and managing content creation' },
      { name: 'Leadership', category: 'leadership', description: 'Ability to guide and inspire teams' },
      { name: 'Python Programming', category: 'technical', description: 'Programming in Python language' },
      { name: 'Financial Analysis', category: 'analytical', description: 'Evaluating financial performance and forecasting' },
      { name: 'Project Management', category: 'leadership', description: 'Planning and executing projects effectively' }
    ];

    const skillIds = defaultSkills.map(skill => this.createSkill(skill).id);

    // Create user skills for the first user (Rahul)
    const userSkills = [
      { userId: 1, skillId: 1, currentLevel: 35, targetLevel: 90, notes: 'Need to improve' },
      { userId: 1, skillId: 2, currentLevel: 80, targetLevel: 95, notes: 'Advanced knowledge' },
      { userId: 1, skillId: 3, currentLevel: 45, targetLevel: 90, notes: 'Growing skill' },
      { userId: 1, skillId: 4, currentLevel: 70, targetLevel: 85, notes: 'Solid foundation' }
    ];

    userSkills.forEach(skill => this.createUserSkill(skill));

    // Create career goal for Rahul
    this.createCareerGoal({
      userId: 1,
      title: 'Data-Driven Marketing Executive',
      description: 'Become a marketing leader with strong analytical skills',
      timelineMonths: 6,
      targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months from now
    });

    // Create learning resources
    const defaultResources = [
      {
        title: 'Introduction to Data Analysis',
        description: 'Learn the fundamentals of data analysis for marketers',
        resourceType: 'course',
        url: 'https://example.com/courses/data-analysis-intro',
        duration: 150, // 2.5 hours in minutes
        provider: 'DataLearn',
        skillIds: ['1']
      },
      {
        title: 'Excel for Data Analysis',
        description: 'Master Excel tools for marketing data analysis',
        resourceType: 'workshop',
        url: 'https://example.com/workshops/excel-data-analysis',
        duration: 180, // 3 hours in minutes
        provider: 'SkillMasters',
        skillIds: ['1', '3']
      },
      {
        title: 'Data Analysis Fundamentals Quiz',
        description: 'Test your understanding of key concepts',
        resourceType: 'assessment',
        url: 'https://example.com/assessments/data-analysis-quiz',
        duration: 30,
        provider: 'DataLearn',
        skillIds: ['1']
      },
      {
        title: 'Google Analytics Fundamentals',
        description: 'Master essential GA4 features for marketers',
        resourceType: 'course',
        url: 'https://example.com/courses/ga4-fundamentals',
        duration: 240, // 4 hours in minutes
        provider: 'GoogleSkills',
        skillIds: ['3']
      },
      {
        title: 'Marketing KPIs & Dashboards',
        description: 'Learn to build effective marketing dashboards',
        resourceType: 'workshop',
        url: 'https://example.com/workshops/marketing-dashboards',
        duration: 210, // 3.5 hours in minutes
        provider: 'MarketingPro',
        skillIds: ['1', '3']
      },
      {
        title: 'Analytics Tools Practical Assessment',
        description: 'Demonstrate your ability to use analytics tools',
        resourceType: 'assessment',
        url: 'https://example.com/assessments/analytics-tools',
        duration: 60,
        provider: 'SkillValidate',
        skillIds: ['1', '3']
      }
    ];

    const resourceIds = defaultResources.map(resource => this.createLearningResource(resource).id);

    // Create a learning path for Rahul
    const modules = [
      {
        id: 1,
        title: 'Data Analysis Fundamentals',
        description: 'Establish a foundation in data analysis',
        estimatedHours: 10,
        resources: [
          { id: 1, completed: true },
          { id: 2, completed: true },
          { id: 3, completed: true }
        ]
      },
      {
        id: 2,
        title: 'Marketing Analytics Tools',
        description: 'Learn to use key marketing analytics tools',
        estimatedHours: 15,
        resources: [
          { id: 4, completed: false },
          { id: 5, completed: false },
          { id: 6, completed: false }
        ]
      }
    ];

    this.createLearningPath({
      userId: 1,
      title: 'Data-Driven Marketing Path',
      description: 'Comprehensive path to become a data-driven marketer',
      modules
    });

    // Create user progress entries
    this.createUserProgress({
      userId: 1,
      resourceId: 1,
      progress: 100,
      completed: true,
      score: 92,
      startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    this.createUserProgress({
      userId: 1,
      resourceId: 2,
      progress: 100,
      completed: true,
      score: 85,
      startedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    });

    this.createUserProgress({
      userId: 1,
      resourceId: 3,
      progress: 100,
      completed: true,
      score: 92,
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });

    this.createUserProgress({
      userId: 1,
      resourceId: 4,
      progress: 35,
      completed: false,
      startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
    });

    // Create user activities
    const activities = [
      {
        userId: 1,
        activityType: 'completed_resource',
        description: 'Completed: Introduction to Data Analysis',
        metadata: { resourceId: 1, score: 92 }
      },
      {
        userId: 1,
        activityType: 'started_resource',
        description: 'Started: Google Analytics Fundamentals',
        metadata: { resourceId: 4, progress: 35 }
      },
      {
        userId: 1,
        activityType: 'updated_skill',
        description: 'Updated your skill profile',
        metadata: { skillId: 2, details: 'Added experience with Facebook Ads Manager' }
      }
    ];

    activities.forEach(activity => this.createUserActivity(activity));

    // Create skill validations
    this.createSkillValidation({
      userId: 1,
      skillId: 2,
      validationType: 'assessment',
      score: 90,
      evidence: 'https://example.com/certifications/digital-marketing',
      validatedBy: 0 // system validated
    });

    this.createSkillValidation({
      userId: 1,
      skillId: 4,
      validationType: 'project',
      score: 85,
      evidence: 'https://example.com/portfolio/content-strategy-project',
      validatedBy: 0
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserID++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date()
    };
    this.usersMap.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;

    const updatedUser: User = {
      ...currentUser,
      ...userData
    };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  // Career goal methods
  async getCareerGoal(id: number): Promise<CareerGoal | undefined> {
    return this.careerGoalsMap.get(id);
  }

  async getCareerGoalsByUserId(userId: number): Promise<CareerGoal[]> {
    return Array.from(this.careerGoalsMap.values())
      .filter(goal => goal.userId === userId);
  }

  async createCareerGoal(goal: InsertCareerGoal): Promise<CareerGoal> {
    const id = this.currentCareerGoalID++;
    const careerGoal: CareerGoal = {
      ...goal,
      id,
      createdAt: new Date()
    };
    this.careerGoalsMap.set(id, careerGoal);
    return careerGoal;
  }

  async updateCareerGoal(id: number, goalData: Partial<InsertCareerGoal>): Promise<CareerGoal | undefined> {
    const currentGoal = await this.getCareerGoal(id);
    if (!currentGoal) return undefined;

    const updatedGoal: CareerGoal = {
      ...currentGoal,
      ...goalData
    };
    this.careerGoalsMap.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteCareerGoal(id: number): Promise<boolean> {
    return this.careerGoalsMap.delete(id);
  }

  // Skill methods
  async getSkill(id: number): Promise<Skill | undefined> {
    return this.skillsMap.get(id);
  }

  async getAllSkills(): Promise<Skill[]> {
    return Array.from(this.skillsMap.values());
  }

  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return Array.from(this.skillsMap.values())
      .filter(skill => skill.category === category);
  }

  async createSkill(insertSkill: InsertSkill): Promise<Skill> {
    const id = this.currentSkillID++;
    const skill: Skill = {
      ...insertSkill,
      id
    };
    this.skillsMap.set(id, skill);
    return skill;
  }

  async updateSkill(id: number, skillData: Partial<InsertSkill>): Promise<Skill | undefined> {
    const currentSkill = await this.getSkill(id);
    if (!currentSkill) return undefined;

    const updatedSkill: Skill = {
      ...currentSkill,
      ...skillData
    };
    this.skillsMap.set(id, updatedSkill);
    return updatedSkill;
  }

  async deleteSkill(id: number): Promise<boolean> {
    return this.skillsMap.delete(id);
  }

  // User skill methods
  async getUserSkill(id: number): Promise<UserSkill | undefined> {
    return this.userSkillsMap.get(id);
  }

  async getUserSkillsByUserId(userId: number): Promise<UserSkill[]> {
    return Array.from(this.userSkillsMap.values())
      .filter(userSkill => userSkill.userId === userId);
  }

  async getUserSkillsWithDetails(userId: number): Promise<(UserSkill & { skillName: string, category: string })[]> {
    const userSkills = await this.getUserSkillsByUserId(userId);
    return Promise.all(
      userSkills.map(async (userSkill) => {
        const skill = await this.getSkill(userSkill.skillId);
        return {
          ...userSkill,
          skillName: skill?.name || 'Unknown Skill',
          category: skill?.category || 'uncategorized'
        };
      })
    );
  }

  async createUserSkill(insertUserSkill: InsertUserSkill): Promise<UserSkill> {
    const id = this.currentUserSkillID++;
    const userSkill: UserSkill = {
      ...insertUserSkill,
      id,
      lastAssessed: new Date()
    };
    this.userSkillsMap.set(id, userSkill);
    return userSkill;
  }

  async updateUserSkill(id: number, userSkillData: Partial<InsertUserSkill>): Promise<UserSkill | undefined> {
    const currentUserSkill = await this.getUserSkill(id);
    if (!currentUserSkill) return undefined;

    const updatedUserSkill: UserSkill = {
      ...currentUserSkill,
      ...userSkillData,
      lastAssessed: new Date()
    };
    this.userSkillsMap.set(id, updatedUserSkill);
    return updatedUserSkill;
  }

  async deleteUserSkill(id: number): Promise<boolean> {
    return this.userSkillsMap.delete(id);
  }

  // Learning resource methods
  async getLearningResource(id: number): Promise<LearningResource | undefined> {
    return this.learningResourcesMap.get(id);
  }

  async getAllLearningResources(): Promise<LearningResource[]> {
    return Array.from(this.learningResourcesMap.values());
  }

  async getLearningResourcesByType(type: string): Promise<LearningResource[]> {
    return Array.from(this.learningResourcesMap.values())
      .filter(resource => resource.resourceType === type);
  }

  async getLearningResourcesBySkill(skillId: number): Promise<LearningResource[]> {
    return Array.from(this.learningResourcesMap.values())
      .filter(resource => resource.skillIds.includes(skillId.toString()));
  }

  async createLearningResource(insertResource: InsertLearningResource): Promise<LearningResource> {
    const id = this.currentLearningResourceID++;
    const resource: LearningResource = {
      ...insertResource,
      id
    };
    this.learningResourcesMap.set(id, resource);
    return resource;
  }

  async updateLearningResource(id: number, resourceData: Partial<InsertLearningResource>): Promise<LearningResource | undefined> {
    const currentResource = await this.getLearningResource(id);
    if (!currentResource) return undefined;

    const updatedResource: LearningResource = {
      ...currentResource,
      ...resourceData
    };
    this.learningResourcesMap.set(id, updatedResource);
    return updatedResource;
  }

  async deleteLearningResource(id: number): Promise<boolean> {
    return this.learningResourcesMap.delete(id);
  }

  // Learning path methods
  async getLearningPath(id: number): Promise<LearningPath | undefined> {
    return this.learningPathsMap.get(id);
  }

  async getLearningPathsByUserId(userId: number): Promise<LearningPath[]> {
    return Array.from(this.learningPathsMap.values())
      .filter(path => path.userId === userId);
  }

  async createLearningPath(insertPath: InsertLearningPath): Promise<LearningPath> {
    const id = this.currentLearningPathID++;
    const path: LearningPath = {
      ...insertPath,
      id,
      createdAt: new Date()
    };
    this.learningPathsMap.set(id, path);
    return path;
  }

  async updateLearningPath(id: number, pathData: Partial<InsertLearningPath>): Promise<LearningPath | undefined> {
    const currentPath = await this.getLearningPath(id);
    if (!currentPath) return undefined;

    const updatedPath: LearningPath = {
      ...currentPath,
      ...pathData
    };
    this.learningPathsMap.set(id, updatedPath);
    return updatedPath;
  }

  async deleteLearningPath(id: number): Promise<boolean> {
    return this.learningPathsMap.delete(id);
  }

  // User progress methods
  async getUserProgress(id: number): Promise<UserProgress | undefined> {
    return this.userProgressMap.get(id);
  }

  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return Array.from(this.userProgressMap.values())
      .filter(progress => progress.userId === userId);
  }

  async getUserProgressByResource(userId: number, resourceId: number): Promise<UserProgress | undefined> {
    return Array.from(this.userProgressMap.values())
      .find(progress => progress.userId === userId && progress.resourceId === resourceId);
  }

  async createUserProgress(insertProgress: InsertUserProgress): Promise<UserProgress> {
    const id = this.currentUserProgressID++;
    const progress: UserProgress = {
      ...insertProgress,
      id
    };
    this.userProgressMap.set(id, progress);
    return progress;
  }

  async updateUserProgress(id: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    const currentProgress = await this.getUserProgress(id);
    if (!currentProgress) return undefined;

    const updatedProgress: UserProgress = {
      ...currentProgress,
      ...progressData
    };
    this.userProgressMap.set(id, updatedProgress);
    return updatedProgress;
  }

  async deleteUserProgress(id: number): Promise<boolean> {
    return this.userProgressMap.delete(id);
  }

  // User activity methods
  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    return this.userActivitiesMap.get(id);
  }

  async getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]> {
    const activities = Array.from(this.userActivitiesMap.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? activities.slice(0, limit) : activities;
  }

  async createUserActivity(insertActivity: InsertUserActivity): Promise<UserActivity> {
    const id = this.currentUserActivityID++;
    const activity: UserActivity = {
      ...insertActivity,
      id,
      createdAt: new Date()
    };
    this.userActivitiesMap.set(id, activity);
    return activity;
  }

  async deleteUserActivity(id: number): Promise<boolean> {
    return this.userActivitiesMap.delete(id);
  }

  // Skill validation methods
  async getSkillValidation(id: number): Promise<SkillValidation | undefined> {
    return this.skillValidationsMap.get(id);
  }

  async getSkillValidationsByUserId(userId: number): Promise<SkillValidation[]> {
    return Array.from(this.skillValidationsMap.values())
      .filter(validation => validation.userId === userId);
  }

  async getSkillValidationsBySkill(skillId: number): Promise<SkillValidation[]> {
    return Array.from(this.skillValidationsMap.values())
      .filter(validation => validation.skillId === skillId);
  }

  async createSkillValidation(insertValidation: InsertSkillValidation): Promise<SkillValidation> {
    const id = this.currentSkillValidationID++;
    const validation: SkillValidation = {
      ...insertValidation,
      id,
      validatedAt: new Date()
    };
    this.skillValidationsMap.set(id, validation);
    return validation;
  }

  async updateSkillValidation(id: number, validationData: Partial<InsertSkillValidation>): Promise<SkillValidation | undefined> {
    const currentValidation = await this.getSkillValidation(id);
    if (!currentValidation) return undefined;

    const updatedValidation: SkillValidation = {
      ...currentValidation,
      ...validationData
    };
    this.skillValidationsMap.set(id, updatedValidation);
    return updatedValidation;
  }

  async deleteSkillValidation(id: number): Promise<boolean> {
    return this.skillValidationsMap.delete(id);
  }
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Career goal methods
  async getCareerGoal(id: number): Promise<CareerGoal | undefined> {
    const [careerGoal] = await db.select().from(careerGoals).where(eq(careerGoals.id, id));
    return careerGoal || undefined;
  }

  async getCareerGoalsByUserId(userId: number): Promise<CareerGoal[]> {
    return db.select().from(careerGoals).where(eq(careerGoals.userId, userId));
  }

  async createCareerGoal(goal: InsertCareerGoal): Promise<CareerGoal> {
    const [careerGoal] = await db.insert(careerGoals).values(goal).returning();
    return careerGoal;
  }

  async updateCareerGoal(id: number, goalData: Partial<InsertCareerGoal>): Promise<CareerGoal | undefined> {
    const [updatedGoal] = await db.update(careerGoals)
      .set(goalData)
      .where(eq(careerGoals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  async deleteCareerGoal(id: number): Promise<boolean> {
    const result = await db.delete(careerGoals).where(eq(careerGoals.id, id));
    return result.rowCount > 0;
  }

  // Skill methods
  async getSkill(id: number): Promise<Skill | undefined> {
    const [skill] = await db.select().from(skills).where(eq(skills.id, id));
    return skill || undefined;
  }

  async getAllSkills(): Promise<Skill[]> {
    return db.select().from(skills);
  }

  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.category, category));
  }

  async createSkill(skill: InsertSkill): Promise<Skill> {
    const [newSkill] = await db.insert(skills).values(skill).returning();
    return newSkill;
  }

  async updateSkill(id: number, skillData: Partial<InsertSkill>): Promise<Skill | undefined> {
    const [updatedSkill] = await db.update(skills)
      .set(skillData)
      .where(eq(skills.id, id))
      .returning();
    return updatedSkill || undefined;
  }

  async deleteSkill(id: number): Promise<boolean> {
    const result = await db.delete(skills).where(eq(skills.id, id));
    return result.rowCount > 0;
  }

  // User skill methods
  async getUserSkill(id: number): Promise<UserSkill | undefined> {
    const [userSkill] = await db.select().from(userSkills).where(eq(userSkills.id, id));
    return userSkill || undefined;
  }

  async getUserSkillsByUserId(userId: number): Promise<UserSkill[]> {
    return db.select().from(userSkills).where(eq(userSkills.userId, userId));
  }

  async getUserSkillsWithDetails(userId: number): Promise<(UserSkill & { skillName: string, category: string })[]> {
    const result = await db.select({
      ...userSkills,
      skillName: skills.name,
      category: skills.category
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId));
    
    return result.map(item => ({
      ...item,
      id: item.id,
      userId: item.userId,
      skillId: item.skillId,
      currentLevel: item.currentLevel,
      targetLevel: item.targetLevel,
      notes: item.notes,
      lastAssessed: item.lastAssessed,
      skillName: item.skillName,
      category: item.category
    }));
  }

  async createUserSkill(userSkill: InsertUserSkill): Promise<UserSkill> {
    const [newUserSkill] = await db.insert(userSkills).values(userSkill).returning();
    return newUserSkill;
  }

  async updateUserSkill(id: number, userSkillData: Partial<InsertUserSkill>): Promise<UserSkill | undefined> {
    const [updatedUserSkill] = await db.update(userSkills)
      .set(userSkillData)
      .where(eq(userSkills.id, id))
      .returning();
    return updatedUserSkill || undefined;
  }

  async deleteUserSkill(id: number): Promise<boolean> {
    const result = await db.delete(userSkills).where(eq(userSkills.id, id));
    return result.rowCount > 0;
  }

  // Learning resource methods
  async getLearningResource(id: number): Promise<LearningResource | undefined> {
    const [resource] = await db.select().from(learningResources).where(eq(learningResources.id, id));
    return resource || undefined;
  }

  async getAllLearningResources(): Promise<LearningResource[]> {
    return db.select().from(learningResources);
  }

  async getLearningResourcesByType(type: string): Promise<LearningResource[]> {
    return db.select().from(learningResources).where(eq(learningResources.resourceType, type));
  }

  async getLearningResourcesBySkill(skillId: number): Promise<LearningResource[]> {
    // This is a bit more complex since we have an array column
    // We need to check if the skillId exists in the skillIds array
    const skillIdStr = skillId.toString();
    const resources = await db.select().from(learningResources);
    return resources.filter(resource => 
      resource.skillIds && resource.skillIds.includes(skillIdStr)
    );
  }

  async createLearningResource(resource: InsertLearningResource): Promise<LearningResource> {
    const [newResource] = await db.insert(learningResources).values(resource).returning();
    return newResource;
  }

  async updateLearningResource(id: number, resourceData: Partial<InsertLearningResource>): Promise<LearningResource | undefined> {
    const [updatedResource] = await db.update(learningResources)
      .set(resourceData)
      .where(eq(learningResources.id, id))
      .returning();
    return updatedResource || undefined;
  }

  async deleteLearningResource(id: number): Promise<boolean> {
    const result = await db.delete(learningResources).where(eq(learningResources.id, id));
    return result.rowCount > 0;
  }

  // Learning path methods
  async getLearningPath(id: number): Promise<LearningPath | undefined> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return path || undefined;
  }

  async getLearningPathsByUserId(userId: number): Promise<LearningPath[]> {
    return db.select().from(learningPaths).where(eq(learningPaths.userId, userId));
  }

  async createLearningPath(path: InsertLearningPath): Promise<LearningPath> {
    const [newPath] = await db.insert(learningPaths).values(path).returning();
    return newPath;
  }

  async updateLearningPath(id: number, pathData: Partial<InsertLearningPath>): Promise<LearningPath | undefined> {
    const [updatedPath] = await db.update(learningPaths)
      .set(pathData)
      .where(eq(learningPaths.id, id))
      .returning();
    return updatedPath || undefined;
  }

  async deleteLearningPath(id: number): Promise<boolean> {
    const result = await db.delete(learningPaths).where(eq(learningPaths.id, id));
    return result.rowCount > 0;
  }

  // User progress methods
  async getUserProgress(id: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.id, id));
    return progress || undefined;
  }

  async getUserProgressByUserId(userId: number): Promise<UserProgress[]> {
    return db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getUserProgressByResource(userId: number, resourceId: number): Promise<UserProgress | undefined> {
    const [progress] = await db.select().from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.resourceId, resourceId)
      ));
    return progress || undefined;
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [newProgress] = await db.insert(userProgress).values(progress).returning();
    return newProgress;
  }

  async updateUserProgress(id: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress | undefined> {
    const [updatedProgress] = await db.update(userProgress)
      .set(progressData)
      .where(eq(userProgress.id, id))
      .returning();
    return updatedProgress || undefined;
  }

  async deleteUserProgress(id: number): Promise<boolean> {
    const result = await db.delete(userProgress).where(eq(userProgress.id, id));
    return result.rowCount > 0;
  }

  // User activity methods
  async getUserActivity(id: number): Promise<UserActivity | undefined> {
    const [activity] = await db.select().from(userActivities).where(eq(userActivities.id, id));
    return activity || undefined;
  }

  async getUserActivitiesByUserId(userId: number, limit?: number): Promise<UserActivity[]> {
    let query = db.select().from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db.insert(userActivities).values(activity).returning();
    return newActivity;
  }

  async deleteUserActivity(id: number): Promise<boolean> {
    const result = await db.delete(userActivities).where(eq(userActivities.id, id));
    return result.rowCount > 0;
  }

  // Skill validation methods
  async getSkillValidation(id: number): Promise<SkillValidation | undefined> {
    const [validation] = await db.select().from(skillValidations).where(eq(skillValidations.id, id));
    return validation || undefined;
  }

  async getSkillValidationsByUserId(userId: number): Promise<SkillValidation[]> {
    return db.select().from(skillValidations).where(eq(skillValidations.userId, userId));
  }

  async getSkillValidationsBySkill(skillId: number): Promise<SkillValidation[]> {
    return db.select().from(skillValidations).where(eq(skillValidations.skillId, skillId));
  }

  async createSkillValidation(validation: InsertSkillValidation): Promise<SkillValidation> {
    const [newValidation] = await db.insert(skillValidations).values(validation).returning();
    return newValidation;
  }

  async updateSkillValidation(id: number, validationData: Partial<InsertSkillValidation>): Promise<SkillValidation | undefined> {
    const [updatedValidation] = await db.update(skillValidations)
      .set(validationData)
      .where(eq(skillValidations.id, id))
      .returning();
    return updatedValidation || undefined;
  }

  async deleteSkillValidation(id: number): Promise<boolean> {
    const result = await db.delete(skillValidations).where(eq(skillValidations.id, id));
    return result.rowCount > 0;
  }
}

// Switch from in-memory storage to database storage
export const storage = new DatabaseStorage();
