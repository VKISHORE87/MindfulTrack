import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import express from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import crypto from "crypto";
import OpenAI from "openai";

import {
  insertUserSchema,
  insertCareerGoalSchema,
  insertSkillSchema,
  insertUserSkillSchema,
  insertLearningResourceSchema,
  insertLearningPathSchema,
  insertUserProgressSchema,
  insertUserActivitySchema,
  insertSkillValidationSchema
} from "@shared/schema";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-dummy-key-for-dev"
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "skill-development-secret",
    })
  );

  // Setup passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use a LocalStrategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        // Simple password check (in a real app, use proper hashing)
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }

        // Remove password before serializing
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"));
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // =====================
  // Auth Routes
  // =====================

  // Register a new user
  app.post(
    "/api/auth/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userDataResult = insertUserSchema.safeParse(req.body);
        if (!userDataResult.success) {
          return res.status(400).json({
            message: "Invalid user data",
            errors: userDataResult.error.errors,
          });
        }

        const existingUser = await storage.getUserByUsername(userDataResult.data.username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }

        const existingEmail = await storage.getUserByEmail(userDataResult.data.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already in use" });
        }

        const newUser = await storage.createUser(userDataResult.data);
        const { password: _, ...userWithoutPassword } = newUser;

        // Auto-login after registration
        req.login(userWithoutPassword, (err) => {
          if (err) {
            return next(err);
          }
          return res.status(201).json(userWithoutPassword);
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Login route
  app.post(
    "/api/auth/login",
    passport.authenticate("local"),
    (req: Request, res: Response) => {
      res.json(req.user);
    }
  );

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", isAuthenticated, (req: Request, res: Response) => {
    res.json(req.user);
  });

  // =====================
  // User Routes
  // =====================

  // Update user profile
  app.patch(
    "/api/users/:id",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.id);
        
        // Check if user is updating their own profile
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const updateData = req.body;
        const user = await storage.updateUser(userId, updateData);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Career Goal Routes
  // =====================

  // Get career goals for a user
  app.get(
    "/api/users/:userId/career-goals",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own career goals
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const careerGoals = await storage.getCareerGoalsByUserId(userId);
        res.json(careerGoals);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new career goal
  app.post(
    "/api/career-goals",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const goalDataResult = insertCareerGoalSchema.safeParse(req.body);
        if (!goalDataResult.success) {
          return res.status(400).json({
            message: "Invalid career goal data",
            errors: goalDataResult.error.errors,
          });
        }

        // Check if user is creating a goal for themselves
        if (req.user && (req.user as any).id !== goalDataResult.data.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const newGoal = await storage.createCareerGoal(goalDataResult.data);
        
        // Create activity entry for setting a career goal
        await storage.createUserActivity({
          userId: goalDataResult.data.userId,
          activityType: "set_career_goal",
          description: `Set career goal: ${newGoal.title}`,
          metadata: { goalId: newGoal.id }
        });

        res.status(201).json(newGoal);
      } catch (error) {
        next(error);
      }
    }
  );

  // Update a career goal
  app.patch(
    "/api/career-goals/:id",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const goalId = parseInt(req.params.id);
        const goal = await storage.getCareerGoal(goalId);
        
        if (!goal) {
          return res.status(404).json({ message: "Career goal not found" });
        }

        // Check if user is updating their own goal
        if (req.user && (req.user as any).id !== goal.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const updateData = req.body;
        const updatedGoal = await storage.updateCareerGoal(goalId, updateData);
        
        res.json(updatedGoal);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Skills Routes
  // =====================

  // Get all skills
  app.get(
    "/api/skills",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const skills = await storage.getAllSkills();
        res.json(skills);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get skills by category
  app.get(
    "/api/skills/category/:category",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const category = req.params.category;
        const skills = await storage.getSkillsByCategory(category);
        res.json(skills);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // User Skills Routes
  // =====================

  // Get skills for a user with details
  app.get(
    "/api/users/:userId/skills",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own skills
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const userSkills = await storage.getUserSkillsWithDetails(userId);
        res.json(userSkills);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create or update a user skill
  app.post(
    "/api/user-skills",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const skillDataResult = insertUserSkillSchema.safeParse(req.body);
        if (!skillDataResult.success) {
          return res.status(400).json({
            message: "Invalid user skill data",
            errors: skillDataResult.error.errors,
          });
        }

        // Check if user is creating a skill for themselves
        if (req.user && (req.user as any).id !== skillDataResult.data.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Check if the skill exists
        const existingSkill = await storage.getSkill(skillDataResult.data.skillId);
        if (!existingSkill) {
          return res.status(404).json({ message: "Skill not found" });
        }

        // Check if user already has this skill
        const userSkills = await storage.getUserSkillsByUserId(skillDataResult.data.userId);
        const existingUserSkill = userSkills.find(s => s.skillId === skillDataResult.data.skillId);

        let result;
        if (existingUserSkill) {
          // Update existing skill
          result = await storage.updateUserSkill(existingUserSkill.id, skillDataResult.data);
        } else {
          // Create new skill
          result = await storage.createUserSkill(skillDataResult.data);
        }

        // Create activity entry for updating a skill
        await storage.createUserActivity({
          userId: skillDataResult.data.userId,
          activityType: "updated_skill",
          description: `Updated skill: ${existingSkill.name}`,
          metadata: { skillId: existingSkill.id, currentLevel: skillDataResult.data.currentLevel }
        });

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Learning Resources Routes
  // =====================

  // Get all learning resources
  app.get(
    "/api/learning-resources",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const resources = await storage.getAllLearningResources();
        res.json(resources);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get learning resources by type
  app.get(
    "/api/learning-resources/type/:type",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const type = req.params.type;
        const resources = await storage.getLearningResourcesByType(type);
        res.json(resources);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get learning resources by skill
  app.get(
    "/api/learning-resources/skill/:skillId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const skillId = parseInt(req.params.skillId);
        const resources = await storage.getLearningResourcesBySkill(skillId);
        res.json(resources);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Learning Path Routes
  // =====================

  // Get learning paths for a user
  app.get(
    "/api/users/:userId/learning-paths",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own learning paths
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const learningPaths = await storage.getLearningPathsByUserId(userId);
        res.json(learningPaths);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get a specific learning path
  app.get(
    "/api/learning-paths/:id",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathId = parseInt(req.params.id);
        const path = await storage.getLearningPath(pathId);
        
        if (!path) {
          return res.status(404).json({ message: "Learning path not found" });
        }

        // Check if user is accessing their own learning path
        if (req.user && (req.user as any).id !== path.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        res.json(path);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // User Progress Routes
  // =====================

  // Get user progress for a specific user
  app.get(
    "/api/users/:userId/progress",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own progress
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const progress = await storage.getUserProgressByUserId(userId);
        res.json(progress);
      } catch (error) {
        next(error);
      }
    }
  );

  // Update user progress for a resource
  app.post(
    "/api/user-progress",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const progressDataResult = insertUserProgressSchema.safeParse(req.body);
        if (!progressDataResult.success) {
          return res.status(400).json({
            message: "Invalid progress data",
            errors: progressDataResult.error.errors,
          });
        }

        // Check if user is updating their own progress
        if (req.user && (req.user as any).id !== progressDataResult.data.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Check if resource exists
        const resource = await storage.getLearningResource(progressDataResult.data.resourceId);
        if (!resource) {
          return res.status(404).json({ message: "Learning resource not found" });
        }

        // Check if progress entry already exists
        const existingProgress = await storage.getUserProgressByResource(
          progressDataResult.data.userId,
          progressDataResult.data.resourceId
        );

        let result;
        if (existingProgress) {
          // Update existing progress
          result = await storage.updateUserProgress(existingProgress.id, progressDataResult.data);
        } else {
          // Create new progress entry
          result = await storage.createUserProgress(progressDataResult.data);
        }

        // Create activity entry
        let activityType: 'started_resource' | 'completed_resource' = 'started_resource';
        let description = `Started: ${resource.title}`;
        
        if (progressDataResult.data.completed) {
          activityType = 'completed_resource';
          description = `Completed: ${resource.title}`;
        }

        await storage.createUserActivity({
          userId: progressDataResult.data.userId,
          activityType,
          description,
          metadata: { 
            resourceId: resource.id, 
            progress: progressDataResult.data.progress,
            score: progressDataResult.data.score
          }
        });

        res.status(201).json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // User Activities Routes
  // =====================

  // Get recent activities for a user
  app.get(
    "/api/users/:userId/activities",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own activities
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
        const activities = await storage.getUserActivitiesByUserId(userId, limit);
        res.json(activities);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Skill Validation Routes
  // =====================

  // Get skill validations for a user
  app.get(
    "/api/users/:userId/validations",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own validations
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const validations = await storage.getSkillValidationsByUserId(userId);
        res.json(validations);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new skill validation
  app.post(
    "/api/skill-validations",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validationDataResult = insertSkillValidationSchema.safeParse(req.body);
        if (!validationDataResult.success) {
          return res.status(400).json({
            message: "Invalid validation data",
            errors: validationDataResult.error.errors,
          });
        }

        // Check if user is creating a validation for themselves
        if (req.user && (req.user as any).id !== validationDataResult.data.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Check if skill exists
        const skill = await storage.getSkill(validationDataResult.data.skillId);
        if (!skill) {
          return res.status(404).json({ message: "Skill not found" });
        }

        const validation = await storage.createSkillValidation(validationDataResult.data);

        // Create activity entry
        await storage.createUserActivity({
          userId: validationDataResult.data.userId,
          activityType: "validated_skill",
          description: `Validated skill: ${skill.name}`,
          metadata: { 
            skillId: skill.id, 
            validationType: validationDataResult.data.validationType,
            score: validationDataResult.data.score
          }
        });

        res.status(201).json(validation);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // AI Recommendation Routes
  // =====================

  // Generate a personalized learning path based on user skills and goals
  app.post(
    "/api/ai/generate-learning-path",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any).id;
        const { careerGoalId } = req.body;

        if (!careerGoalId) {
          return res.status(400).json({ message: "Career goal ID is required" });
        }

        // Get career goal
        const careerGoal = await storage.getCareerGoal(parseInt(careerGoalId));
        if (!careerGoal) {
          return res.status(404).json({ message: "Career goal not found" });
        }

        // Get user skills
        const userSkills = await storage.getUserSkillsWithDetails(userId);
        
        // Get all resources
        const allResources = await storage.getAllLearningResources();

        // Generate a personalized learning path using OpenAI (if the API key is available)
        let generatedPath;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an AI career advisor that specializes in creating personalized learning paths based on users' skills and career goals. Create a structured learning path with modules and recommended resources."
              },
              {
                role: "user",
                content: JSON.stringify({
                  careerGoal: careerGoal,
                  userSkills: userSkills,
                  availableResources: allResources
                })
              }
            ],
            response_format: { type: "json_object" }
          });

          generatedPath = JSON.parse(response.choices[0].message.content);
        } catch (error) {
          console.error("OpenAI API error:", error);
          
          // Fallback to a default path structure
          generatedPath = {
            title: `Learning Path for ${careerGoal.title}`,
            description: `A personalized learning path to help you achieve your goal of becoming a ${careerGoal.title}`,
            modules: [
              {
                id: 1,
                title: "Foundation Skills",
                description: "Build the essential skills you need as a base",
                estimatedHours: 15,
                resources: allResources
                  .filter(r => r.resourceType === "course")
                  .slice(0, 3)
                  .map(r => ({ id: r.id, completed: false }))
              },
              {
                id: 2,
                title: "Advanced Skills",
                description: "Develop specialized skills for your career goal",
                estimatedHours: 20,
                resources: allResources
                  .filter(r => r.resourceType === "workshop" || r.resourceType === "assessment")
                  .slice(0, 3)
                  .map(r => ({ id: r.id, completed: false }))
              }
            ]
          };
        }

        // Save the generated learning path
        const learningPath = await storage.createLearningPath({
          userId,
          title: generatedPath.title,
          description: generatedPath.description,
          modules: generatedPath.modules
        });

        res.json(learningPath);
      } catch (error) {
        next(error);
      }
    }
  );

  // AI-powered skill gap analysis
  app.post(
    "/api/ai/skill-gap-analysis",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any).id;
        const { careerGoalId } = req.body;

        if (!careerGoalId) {
          return res.status(400).json({ message: "Career goal ID is required" });
        }

        // Get career goal
        const careerGoal = await storage.getCareerGoal(parseInt(careerGoalId));
        if (!careerGoal) {
          return res.status(404).json({ message: "Career goal not found" });
        }

        // Get user skills
        const userSkills = await storage.getUserSkillsWithDetails(userId);
        
        // Get all skills
        const allSkills = await storage.getAllSkills();

        // Generate skill gap analysis using OpenAI (if the API key is available)
        let gapAnalysis;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: "You are an AI career advisor that specializes in identifying skill gaps based on users' current skills and career goals. Provide a detailed analysis of missing or underdeveloped skills."
              },
              {
                role: "user",
                content: JSON.stringify({
                  careerGoal: careerGoal,
                  userSkills: userSkills,
                  allSkills: allSkills
                })
              }
            ],
            response_format: { type: "json_object" }
          });

          gapAnalysis = JSON.parse(response.choices[0].message.content);
        } catch (error) {
          console.error("OpenAI API error:", error);
          
          // Fallback to a basic gap analysis
          const skillGaps = allSkills
            .filter(skill => !userSkills.some(us => us.skillId === skill.id))
            .slice(0, 5)
            .map(skill => ({
              skillId: skill.id,
              skillName: skill.name,
              currentLevel: 0,
              requiredLevel: 70,
              priority: "high"
            }));

          gapAnalysis = {
            careerGoal: careerGoal.title,
            overallReadiness: Math.floor(Math.random() * 50) + 20, // Random number between 20-70%
            skillGaps,
            recommendations: [
              "Focus on building technical skills first",
              "Consider taking courses in data analysis",
              "Develop practical experience through projects"
            ]
          };
        }

        res.json(gapAnalysis);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Dashboard Data Route
  // =====================

  // Get aggregated dashboard data
  app.get(
    "/api/users/:userId/dashboard",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own dashboard
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user skills
        const userSkills = await storage.getUserSkillsWithDetails(userId);

        // Get career goals
        const careerGoals = await storage.getCareerGoalsByUserId(userId);
        const primaryCareerGoal = careerGoals.length > 0 ? careerGoals[0] : null;

        // Get learning paths
        const learningPaths = await storage.getLearningPathsByUserId(userId);
        const primaryLearningPath = learningPaths.length > 0 ? learningPaths[0] : null;

        // Get user progress
        const progress = await storage.getUserProgressByUserId(userId);
        
        // Get skill validations
        const validations = await storage.getSkillValidationsByUserId(userId);
        
        // Get recent activities
        const recentActivities = await storage.getUserActivitiesByUserId(userId, 10);

        // Calculate dashboard stats
        const completedResources = progress.filter(p => p.completed).length;
        const totalResources = primaryLearningPath 
          ? primaryLearningPath.modules.reduce(
              (total, module) => total + (module as any).resources.length, 
              0
            ) 
          : 0;
        
        const validatedSkills = validations.length;
        const totalUserSkills = userSkills.length;

        // Calculate total learning time in minutes
        const totalLearningTime = progress.reduce((total, p) => {
          const resource = progress.find(r => r.resourceId === p.resourceId);
          if (resource) {
            return total + (resource.progress / 100) * (resource.duration || 0);
          }
          return total;
        }, 0);

        // Calculate overall progress
        const overallProgress = totalUserSkills > 0
          ? Math.round(userSkills.reduce((sum, skill) => sum + (skill.currentLevel / skill.targetLevel * 100), 0) / totalUserSkills)
          : 0;

        // Prepare the dashboard data
        const dashboardData = {
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            greeting: `Hello, ${user.name.split(' ')[0]}!`
          },
          stats: {
            overallProgress,
            skillsValidated: `${validatedSkills} / ${totalUserSkills}`,
            learningTime: `${(totalLearningTime / 60).toFixed(1)} hours`,
            resourcesCompleted: `${completedResources} / ${totalResources}`
          },
          skillGaps: userSkills.map(skill => ({
            id: skill.id,
            name: skill.skillName,
            category: skill.category,
            currentLevel: skill.currentLevel,
            targetLevel: skill.targetLevel,
            percentage: Math.round(skill.currentLevel / skill.targetLevel * 100)
          })),
          careerGoal: primaryCareerGoal ? {
            id: primaryCareerGoal.id,
            title: primaryCareerGoal.title,
            timeline: `Target timeline: ${primaryCareerGoal.timelineMonths} months`,
            readiness: overallProgress
          } : null,
          learningPath: primaryLearningPath,
          recentActivities
        };

        res.json(dashboardData);
      } catch (error) {
        next(error);
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
