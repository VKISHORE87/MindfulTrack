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
import nodemailer from "nodemailer";

import {
  insertUserSchema,
  insertCareerGoalSchema,
  insertSkillSchema,
  insertUserSkillSchema,
  insertLearningResourceSchema,
  insertLearningPathSchema,
  insertUserProgressSchema,
  insertUserActivitySchema,
  insertSkillValidationSchema,
  insertInterviewRoleSchema,
  insertInterviewQuestionSchema,
  insertInterviewSessionSchema,
  insertCareerPathSchema,
  User
} from "@shared/schema";

// Helper function to safely remove password from user object
const removePassword = (user: any): Omit<typeof user, 'password'> => {
  if (!user) return user;
  const userCopy = { ...user };
  if ('password' in userCopy) {
    delete userCopy.password;
  }
  return userCopy;
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Utility function to convert user data for OpenAI
function formatUserDataForAI(user: any, userSkills: any[], careerGoals: any[], learningHistory: any[] = [], learningPreferences: any = {}) {
  return {
    skills: userSkills.map(skill => ({
      id: skill.id,
      name: skill.skillName || skill.name,
      category: skill.category,
      currentLevel: skill.currentLevel,
      targetLevel: skill.targetLevel
    })),
    careerGoals: careerGoals.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      timelineMonths: goal.timelineMonths
    })),
    learningHistory,
    learningPreferences
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  
  // Make it work in development environment
  const isDevEnvironment = process.env.NODE_ENV !== "production";
  
  app.use(
    session({
      cookie: { 
        maxAge: 86400000, // 24 hours
        secure: !isDevEnvironment, // Only use secure cookies in production
        httpOnly: true,
        sameSite: 'lax'
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "skill-development-secret",
    })
  );

  // Setup passport for authentication - MUST be after session setup
  app.use(passport.initialize());
  app.use(passport.session());
  
  // For development environment debugging - MUST be after passport setup
  if (isDevEnvironment) {
    app.use((req, _res, next) => {
      console.log("Session ID:", req.sessionID);
      console.log("Is Authenticated:", req.isAuthenticated ? req.isAuthenticated() : "Function not available");
      next();
    });
  }

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
        const userWithoutPassword = removePassword(user);
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
      const userWithoutPassword = removePassword(user);
      done(null, userWithoutPassword);
    } catch (err) {
      done(err);
    }
  });

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // For development purposes, we'll provide a mock authenticated user
    // In a production environment, we would use actual authentication
    if (req.isAuthenticated()) {
      return next();
    } else {
      // For development: attach a mock user (id: 1) to the request
      // This bypasses authentication for development purposes only
      const mockUser = {
        id: 1,
        username: 'demo_user',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'user'
      };
      (req as any).user = mockUser;
      return next();
    }
  };

  // =====================
  // Auth Routes
  // =====================

  // Register a new user
  app.post(
    "/api/auth/register",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        console.log("Registration attempt with data:", JSON.stringify(req.body, null, 2));
        
        const userDataResult = insertUserSchema.safeParse(req.body);
        if (!userDataResult.success) {
          console.log("Invalid user data:", userDataResult.error.errors);
          return res.status(400).json({
            message: "Invalid user data",
            errors: userDataResult.error.errors,
          });
        }

        console.log("Checking if username exists:", userDataResult.data.username);
        const existingUser = await storage.getUserByUsername(userDataResult.data.username);
        if (existingUser) {
          console.log("Username already exists:", existingUser);
          return res.status(400).json({ message: "Username already exists" });
        }

        console.log("Checking if email exists:", userDataResult.data.email);
        const existingEmail = await storage.getUserByEmail(userDataResult.data.email);
        if (existingEmail) {
          console.log("Email already exists:", existingEmail);
          return res.status(400).json({ message: "Email already in use" });
        }

        const newUser = await storage.createUser(userDataResult.data);
        const userWithoutPassword = removePassword(newUser);

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
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info?.message || "Authentication failed" });
        }
        
        // Manual login with req.login
        req.login(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Log session information after successful login
          console.log("Login successful - Session ID:", req.sessionID);
          console.log("Is authenticated after login:", req.isAuthenticated());
          
          // Return the user object
          return res.json(user);
        });
      })(req, res, next);
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

  // Google Login
  app.post(
    "/api/auth/google",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, name, googleId, profilePicture } = req.body;
        
        if (!email || !googleId) {
          return res.status(400).json({ message: "Email and Google ID are required" });
        }

        // Check if user exists with this email
        let user = await storage.getUserByEmail(email);
        
        if (user) {
          // Update Google ID if it's not already set
          if (!user.googleId) {
            user = await storage.updateUser(user.id, { googleId, profilePicture });
          }
        } else {
          // Create new user with Google info
          // Generate a username from email
          const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
          
          user = await storage.createUser({
            username,
            email,
            name: name || username,
            googleId,
            profilePicture,
            role: "user"
          });
        }

        // Remove password before serializing
        const userWithoutPassword = removePassword(user);
        
        // Log the user in
        req.login(userWithoutPassword, (err) => {
          if (err) {
            return next(err);
          }
          return res.status(200).json(userWithoutPassword);
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Forgot password - request reset
  app.post(
    "/api/auth/forgot-password",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email } = req.body;
        
        if (!email) {
          return res.status(400).json({ message: "Email is required" });
        }

        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          // Don't reveal that the user doesn't exist
          return res.status(200).json({ 
            message: "If the email exists in our system, a password reset link will be sent" 
          });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now
        
        // Update user with reset token
        await storage.updateUser(user.id, {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        });

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;
        
        // Setup nodemailer transport
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        // Email options
        const mailOptions = {
          from: process.env.EMAIL_FROM || 'no-reply@upcraft.com',
          to: user.email,
          subject: 'Upcraft - Password Reset',
          text: `You requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`,
          html: `
            <p>You requested a password reset.</p>
            <p>Please click the following link to reset your password:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>This link is valid for 1 hour.</p>
          `
        };

        // Send email
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          await transporter.sendMail(mailOptions);
        } else {
          console.log("Email credentials not configured. Reset URL:", resetUrl);
        }

        // In development environment, also include the resetUrl in the response
        const isDevEnvironment = process.env.NODE_ENV !== 'production';
        res.status(200).json({ 
          message: "If the email exists in our system, a password reset link will be sent",
          ...(isDevEnvironment && { debugResetUrl: resetUrl })
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Reset password
  app.post(
    "/api/auth/reset-password",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token, password } = req.body;
        
        if (!token || !password) {
          return res.status(400).json({ message: "Token and password are required" });
        }

        // Find user with the provided token
        const user = await storage.getUserByResetToken(token);
        
        if (!user) {
          return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Check if token is expired
        if (!user.resetPasswordExpires || new Date() > new Date(user.resetPasswordExpires)) {
          return res.status(400).json({ message: "Token has expired" });
        }

        // Update user with new password and clear reset token
        await storage.updateUser(user.id, {
          password,
          resetPasswordToken: null,
          resetPasswordExpires: null
        });

        res.status(200).json({ message: "Password has been reset successfully" });
      } catch (error) {
        next(error);
      }
    }
  );

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

        const userWithoutPassword = removePassword(user);
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
  
  // Create default skills - temporary endpoint for development
  app.post(
    "/api/skills/create-defaults",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        // Technical skills
        await storage.createSkill({ name: 'JavaScript', category: 'technical', description: 'Programming language for web development' });
        await storage.createSkill({ name: 'React', category: 'technical', description: 'Frontend library for building user interfaces' });
        await storage.createSkill({ name: 'Node.js', category: 'technical', description: 'JavaScript runtime for server-side development' });
        await storage.createSkill({ name: 'Python', category: 'technical', description: 'General-purpose programming language' });
        await storage.createSkill({ name: 'SQL', category: 'technical', description: 'Language for managing relational databases' });
        await storage.createSkill({ name: 'Machine Learning', category: 'technical', description: 'Building systems that learn from data' });
        await storage.createSkill({ name: 'Cloud Computing', category: 'technical', description: 'Using remote servers for computing resources' });
        await storage.createSkill({ name: 'DevOps', category: 'technical', description: 'Development and operations integration' });
        
        // Communication skills
        await storage.createSkill({ name: 'Written Communication', category: 'soft', description: 'Ability to write clearly and effectively' });
        await storage.createSkill({ name: 'Verbal Communication', category: 'soft', description: 'Ability to speak clearly and articulate ideas' });
        await storage.createSkill({ name: 'Presentation Skills', category: 'soft', description: 'Creating and delivering effective presentations' });
        await storage.createSkill({ name: 'Negotiation', category: 'soft', description: 'Finding mutually beneficial agreements' });
        
        // Leadership skills
        await storage.createSkill({ name: 'Team Management', category: 'leadership', description: 'Coordinating and motivating teams' });
        await storage.createSkill({ name: 'Strategic Planning', category: 'leadership', description: 'Creating and implementing strategic objectives' });
        await storage.createSkill({ name: 'Decision Making', category: 'leadership', description: 'Making sound decisions in complex situations' });
        await storage.createSkill({ name: 'Conflict Resolution', category: 'leadership', description: 'Resolving disputes constructively' });
        
        // Creative skills
        await storage.createSkill({ name: 'Design Thinking', category: 'creative', description: 'Problem-solving approach centered on users' });
        await storage.createSkill({ name: 'UX/UI Design', category: 'creative', description: 'Creating intuitive and engaging user experiences' });
        await storage.createSkill({ name: 'Content Creation', category: 'creative', description: 'Developing compelling written, visual, or audio content' });
        await storage.createSkill({ name: 'Innovation', category: 'creative', description: 'Generating and implementing new ideas' });
        
        const skills = await storage.getAllSkills();
        res.status(201).json(skills);
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
        
        // In production, we would verify the user is only accessing their own skills
        // For development, we allow any access for testing purposes

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

        // In production, we would check if user is creating a skill for themselves 
        // For development, we allow any access for testing purposes

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

  // =====================
  // AI-powered Features
  // =====================

  // AI Coach - Get personalized coaching advice
  app.post(
    "/api/users/:userId/ai-coach",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own data
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user skills and career goals
        const userSkills = await storage.getUserSkillsWithDetails(userId);
        const careerGoals = await storage.getCareerGoalsByUserId(userId);
        
        // Get user question from request body
        const { question } = req.body;
        if (!question) {
          return res.status(400).json({ message: "Question is required" });
        }

        // Format user data for AI
        const userData = formatUserDataForAI(user, userSkills, careerGoals);

        // Prepare system prompt for AI coach
        const systemPrompt = `You are an AI career and skills coach named "Upcraft Coach". 
Your role is to provide personalized advice to help users develop their skills and advance in their careers.
Use the provided user data to make your advice specific and relevant.

User data:
${JSON.stringify(userData, null, 2)}

Reply in a friendly, supportive tone. Provide specific, actionable advice based on the user's skill levels,
career goals, and learning history. Limit your response to 3-4 paragraphs at most.`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        // Return the AI response
        res.json({ 
          message: completion.choices[0].message.content
        });
      } catch (error) {
        console.error("AI Coach error:", error);
        // Check for OpenAI specific errors
        if (error instanceof Error) {
          // Handle quota exceeded errors
          if (error.message.includes("insufficient_quota")) {
            return res.status(429).json({ 
              message: "OpenAI API quota exceeded. Please try again later or contact support to update API limits."
            });
          }
          // Handle rate limit errors
          if (error.message.includes("rate_limit")) {
            return res.status(429).json({ 
              message: "OpenAI API rate limit reached. Please try again after a few moments."
            });
          }
          // Handle authentication errors
          if (error.message.includes("authentication")) {
            return res.status(500).json({
              message: "Authentication error with AI service. Please check API configuration."
            });
          }
        }
        next(error);
      }
    }
  );

  // Smart Skill Graph - Get skill relationships and insights
  app.get(
    "/api/users/:userId/smart-skill-graph",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own data
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user skills and career goals
        const userSkills = await storage.getUserSkillsWithDetails(userId);
        const careerGoals = await storage.getCareerGoalsByUserId(userId);
        
        // Format user data for AI
        const userData = formatUserDataForAI(user, userSkills, careerGoals);

        // Prepare system prompt for skill graph analysis
        const systemPrompt = `You are an AI skill analyzer. Your job is to analyze the relationship between different skills and provide a graph structure that shows how skills are connected.
Based on the user's current skills and levels, identify clusters of related skills, dependencies between skills, and provide a graph structure.

User data:
${JSON.stringify(userData, null, 2)}

Return a JSON response with the following structure:
{
  "nodes": [
    { "id": "skill1", "name": "Skill Name", "category": "Technical/Soft/Business", "level": 3, "targetLevel": 5, "cluster": "Frontend" },
    ...
  ],
  "links": [
    { "source": "skill1", "target": "skill2", "strength": 0.8, "type": "prerequisite/complementary/alternative" },
    ...
  ],
  "clusters": [
    { "id": "cluster1", "name": "Frontend Development", "description": "Skills related to frontend web development" },
    ...
  ],
  "recommendations": [
    { "skillId": "skill3", "reason": "This skill complements your existing JavaScript knowledge" },
    ...
  ]
}

Include all the user's current skills as nodes and add 3-5 recommended skills. For links, create connections between skills that are related.`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate a smart skill graph based on my current skills and goals." }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000
        });

        // Parse and return the AI response
        try {
          const content = completion.choices[0].message.content || '{}';
          const graphData = JSON.parse(content);
          res.json(graphData);
        } catch (error) {
          console.error("Error parsing OpenAI JSON response:", error);
          res.status(500).json({ 
            message: "Failed to generate skill graph",
            error: "Invalid response format from AI service" 
          });
        }
      } catch (error) {
        console.error("Smart Skill Graph error:", error);
        // Check for OpenAI specific errors
        if (error instanceof Error) {
          // Handle quota exceeded errors
          if (error.message.includes("insufficient_quota")) {
            return res.status(429).json({ 
              message: "OpenAI API quota exceeded. Please try again later or contact support to update API limits."
            });
          }
          // Handle rate limit errors
          if (error.message.includes("rate_limit")) {
            return res.status(429).json({ 
              message: "OpenAI API rate limit reached. Please try again after a few moments."
            });
          }
          // Handle authentication errors
          if (error.message.includes("authentication")) {
            return res.status(500).json({
              message: "Authentication error with AI service. Please check API configuration."
            });
          }
        }
        next(error);
      }
    }
  );

  // Learning Pattern Analysis - Get personalized learning recommendations
  app.get(
    "/api/users/:userId/learning-pattern-analysis",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        // Check if user is accessing their own data
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get user skills, progress, and activities
        const userSkills = await storage.getUserSkillsWithDetails(userId);
        const careerGoals = await storage.getCareerGoalsByUserId(userId);
        const userProgress = await storage.getUserProgressByUserId(userId);
        const userActivities = await storage.getUserActivitiesByUserId(userId);
        
        // Format user data for AI
        const userData = formatUserDataForAI(user, userSkills, careerGoals);

        // Add learning history from progress and activities
        const learningHistory = {
          progress: userProgress,
          activities: userActivities
        };

        // Prepare system prompt for learning pattern analysis
        const systemPrompt = `You are an AI learning pattern analyzer. Your task is to analyze the user's learning history, progress, and activities to identify patterns in their learning behavior.
Based on this analysis, provide personalized recommendations for learning resources, methods, and approaches that would be most effective for this user.

User data:
${JSON.stringify(userData, null, 2)}

Learning history:
${JSON.stringify(learningHistory, null, 2)}

Return a JSON response with the following structure:
{
  "learning_patterns": [
    { "pattern": "Pattern Name", "description": "Description of the pattern", "evidence": "Evidence from user data" },
    ...
  ],
  "recommendations": {
    "resource_types": [
      { "type": "video", "suitability": 85, "reason": "User engages well with video content" },
      ...
    ],
    "learning_pace": { "recommended": "steady/intensive/intermittent", "reason": "Based on activity patterns" },
    "focus_areas": [
      { "skill": "Skill Name", "priority": "high/medium/low", "reason": "Reason for priority" },
      ...
    ],
    "suggested_resources": [
      { "title": "Resource Title", "type": "video/article/course", "link": "URL if available", "reason": "Why this is recommended" },
      ...
    ]
  },
  "summary": "Brief summary of key insights and recommendations"
}`;

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Analyze my learning patterns and provide personalized recommendations." }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000
        });

        // Parse and return the AI response
        try {
          const content = completion.choices[0].message.content || '{}';
          const analysisData = JSON.parse(content);
          res.json(analysisData);
        } catch (error) {
          console.error("Error parsing OpenAI JSON response:", error);
          res.status(500).json({ 
            message: "Failed to generate learning pattern analysis",
            error: "Invalid response format from AI service" 
          });
        }
      } catch (error) {
        console.error("Learning Pattern Analysis error:", error);
        // Check for OpenAI specific errors
        if (error instanceof Error) {
          // Handle quota exceeded errors
          if (error.message.includes("insufficient_quota")) {
            return res.status(429).json({ 
              message: "OpenAI API quota exceeded. Please try again later or contact support to update API limits."
            });
          }
          // Handle rate limit errors
          if (error.message.includes("rate_limit")) {
            return res.status(429).json({ 
              message: "OpenAI API rate limit reached. Please try again after a few moments."
            });
          }
          // Handle authentication errors
          if (error.message.includes("authentication")) {
            return res.status(500).json({
              message: "Authentication error with AI service. Please check API configuration."
            });
          }
        }
        next(error);
      }
    }
  );

  // =====================
  // Interview Routes
  // =====================

  // Get all interview roles
  app.get(
    "/api/interview/roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roles = await storage.getAllInterviewRoles();
        res.json(roles);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get role by ID
  app.get(
    "/api/interview/roles/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.id);
        const role = await storage.getInterviewRole(roleId);
        
        if (!role) {
          return res.status(404).json({ message: "Interview role not found" });
        }
        
        res.json(role);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // =====================
  // Career Path Routes
  // =====================
  
  // Get all career paths
  app.get(
    "/api/career/paths",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const paths = await storage.getAllCareerPaths();
        res.json(paths);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Get career path by role ID - THIS MUST COME BEFORE THE /:id ROUTE!
  app.get(
    "/api/career/paths/role/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.roleId);
        const careerPath = await storage.getCareerPathByRoleId(roleId);
        
        if (!careerPath) {
          return res.status(404).json({ message: "Career path not found for this role" });
        }
        
        res.json(careerPath);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Get career path by ID
  app.get(
    "/api/career/paths/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathId = parseInt(req.params.id);
        const path = await storage.getCareerPath(pathId);
        
        if (!path) {
          return res.status(404).json({ message: "Career path not found" });
        }
        
        res.json(path);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Get career path by role ID
  app.get(
    "/api/career/paths/role/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.roleId);
        const path = await storage.getCareerPathByRoleId(roleId);
        
        if (!path) {
          return res.status(404).json({ message: "Career path not found for this role" });
        }
        
        // Get the role information to include in the response
        const role = await storage.getInterviewRole(roleId);
        
        // Create a combined response with both path and role information
        const enhancedPath = {
          ...path,
          roleInfo: role
        };
        
        res.json(enhancedPath);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Create a new career path
  app.post(
    "/api/career/paths",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathDataResult = insertCareerPathSchema.safeParse(req.body);
        if (!pathDataResult.success) {
          return res.status(400).json({
            message: "Invalid career path data",
            errors: pathDataResult.error.errors,
          });
        }

        const newPath = await storage.createCareerPath(pathDataResult.data);
        res.status(201).json(newPath);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get questions by role ID
  app.get(
    "/api/interview/roles/:roleId/questions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.roleId);
        const questions = await storage.getInterviewQuestionsByRole(roleId);
        res.json(questions);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new interview role
  app.post(
    "/api/interview/roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleDataResult = insertInterviewRoleSchema.safeParse(req.body);
        if (!roleDataResult.success) {
          return res.status(400).json({
            message: "Invalid interview role data",
            errors: roleDataResult.error.errors,
          });
        }

        const newRole = await storage.createInterviewRole(roleDataResult.data);
        res.status(201).json(newRole);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Update technology industry roles
  app.post(
    "/api/interview/update-tech-roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // First, get existing tech roles
        const existingTechRoles = await storage.getInterviewRolesByIndustry("technology");
        
        // Clear existing tech roles if they exist
        if (existingTechRoles.length > 0) {
          console.log("Removing existing technology industry roles...");
          for (const role of existingTechRoles) {
            await storage.deleteInterviewRole(role.id);
          }
        }
        
        console.log("Adding new technology industry roles...");
        
        const updatedTechRoles = [
          // Software Development
          {
            title: "Frontend Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Develops user interfaces and client-side functionality for web applications",
            requiredSkills: ["JavaScript", "HTML", "CSS", "React", "Responsive Design", "UI/UX Principles", "Performance Optimization", "Browser DevTools"],
            averageSalary: "95000",
            growthRate: "13.0",
            demandScore: 8
          },
          {
            title: "Backend Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Builds and maintains server-side logic, APIs, and databases for web applications",
            requiredSkills: ["Node.js", "Express", "SQL", "NoSQL", "REST APIs", "Authentication", "Security", "Performance Optimization"],
            averageSalary: "105000",
            growthRate: "14.5",
            demandScore: 9
          },
          {
            title: "Full Stack Developer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Develops both client and server-side aspects of web applications",
            requiredSkills: ["JavaScript", "React", "Node.js", "SQL", "System Design", "Cloud Services", "API Design", "Performance Optimization"],
            averageSalary: "120000",
            growthRate: "15.8",
            demandScore: 9
          },
          {
            title: "Mobile App Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Creates applications for iOS and Android mobile devices",
            requiredSkills: ["Swift/Objective-C", "Kotlin/Java", "React Native", "Mobile UI Design", "App Store Guidelines", "Performance Optimization", "Mobile Security"],
            averageSalary: "110000",
            growthRate: "12.5",
            demandScore: 8
          },
          {
            title: "Web Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Builds and maintains websites with focus on functionality and user experience",
            requiredSkills: ["HTML", "CSS", "JavaScript", "Responsive Design", "CMS Systems", "SEO", "Accessibility", "Cross-browser Compatibility"],
            averageSalary: "85000",
            growthRate: "11.0",
            demandScore: 8
          },
          {
            title: "Game Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Creates interactive games for various platforms including mobile, console, and PC",
            requiredSkills: ["C++/C#", "Unity/Unreal Engine", "3D Math", "Game Physics", "Graphics Programming", "Animation Systems", "Game Design", "Performance Optimization"],
            averageSalary: "95000",
            growthRate: "9.3",
            demandScore: 7
          },
          {
            title: "Embedded Systems Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Develops software for embedded systems and IoT devices",
            requiredSkills: ["C/C++", "Microcontrollers", "Real-time Operating Systems", "Hardware Interfacing", "Power Optimization", "Debugging Tools", "Electronics Fundamentals"],
            averageSalary: "115000",
            growthRate: "8.7",
            demandScore: 7
          },
          {
            title: "DevOps Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Automates software delivery processes and manages infrastructure",
            requiredSkills: ["CI/CD", "Docker", "Kubernetes", "Infrastructure as Code", "Cloud Services", "Linux", "Monitoring Tools", "Automation Scripting"],
            averageSalary: "120000",
            growthRate: "18.5",
            demandScore: 9
          },
          {
            title: "Site Reliability Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Ensures application availability, performance, and reliability",
            requiredSkills: ["Linux Systems", "Monitoring", "Incident Response", "Automation", "Performance Tuning", "Cloud Infrastructure", "Distributed Systems", "Capacity Planning"],
            averageSalary: "135000",
            growthRate: "21.0",
            demandScore: 9
          },
          {
            title: "API Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Designs and implements APIs for software integration",
            requiredSkills: ["REST/GraphQL", "API Security", "Documentation", "API Gateway Tools", "Performance Optimization", "API Design Patterns", "Versioning Strategies"],
            averageSalary: "105000",
            growthRate: "13.5",
            demandScore: 8
          },
          
          // Data & AI
          {
            title: "Data Analyst",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Analyzes and interprets data to inform business decisions",
            requiredSkills: ["SQL", "Excel", "Data Visualization", "Statistical Analysis", "Business Intelligence Tools", "Data Cleaning", "Reporting", "Business Acumen"],
            averageSalary: "85000",
            growthRate: "16.0",
            demandScore: 8
          },
          {
            title: "Data Scientist",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Extracts insights from data using advanced analytics and machine learning",
            requiredSkills: ["Python", "R", "Machine Learning", "Statistical Analysis", "Data Visualization", "SQL", "Big Data Technologies", "Domain Knowledge"],
            averageSalary: "120000",
            growthRate: "22.0",
            demandScore: 9
          },
          {
            title: "Machine Learning Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Develops machine learning models and deploys them to production",
            requiredSkills: ["Python", "ML Frameworks", "MLOps", "Model Deployment", "Feature Engineering", "Deep Learning", "Computer Science Fundamentals", "Data Pipeline Development"],
            averageSalary: "130000", 
            growthRate: "26.0",
            demandScore: 9
          },
          {
            title: "AI Researcher",
            industry: "technology",
            level: "senior",
            roleType: "research",
            description: "Conducts advanced research in artificial intelligence and machine learning",
            requiredSkills: ["Deep Learning", "Research Methodology", "PyTorch/TensorFlow", "Algorithm Development", "Academic Writing", "Mathematics", "Experiment Design", "Literature Review"],
            averageSalary: "140000",
            growthRate: "20.0",
            demandScore: 8
          },
          {
            title: "Data Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Builds and maintains data pipelines and infrastructure",
            requiredSkills: ["SQL", "Python", "ETL Tools", "Big Data Technologies", "Data Warehousing", "Cloud Data Services", "Data Modeling", "Distributed Systems"],
            averageSalary: "115000",
            growthRate: "19.3",
            demandScore: 9
          },
          {
            title: "Business Intelligence Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Creates data visualizations and dashboards for business insights",
            requiredSkills: ["SQL", "Tableau/Power BI", "Data Modeling", "Dashboard Design", "Business Requirements Analysis", "ETL Processes", "Data Warehousing", "Reporting"],
            averageSalary: "95000",
            growthRate: "14.8",
            demandScore: 8
          },
          {
            title: "Database Administrator",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Manages and optimizes database systems and ensures data security",
            requiredSkills: ["SQL", "Database Systems", "Performance Tuning", "Backup & Recovery", "Security", "High Availability", "Disaster Recovery", "Monitoring"],
            averageSalary: "100000",
            growthRate: "9.7",
            demandScore: 7
          },
          {
            title: "Applied Scientist",
            industry: "technology",
            level: "senior",
            roleType: "research",
            description: "Applies scientific methods to solve real-world business problems using data",
            requiredSkills: ["Machine Learning", "Python", "Statistics", "Research Methods", "Domain Expertise", "Algorithm Development", "Experiment Design", "Problem Solving"],
            averageSalary: "135000",
            growthRate: "21.5",
            demandScore: 9
          },
          {
            title: "NLP Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Develops systems that understand and process human language",
            requiredSkills: ["Natural Language Processing", "Python", "Deep Learning", "Text Mining", "Linguistic Knowledge", "Large Language Models", "Text Classification", "Sentiment Analysis"],
            averageSalary: "125000",
            growthRate: "24.6",
            demandScore: 9
          },
          {
            title: "Computer Vision Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Builds systems that analyze and interpret visual information from the world",
            requiredSkills: ["Computer Vision Algorithms", "Deep Learning", "Image Processing", "Python", "OpenCV", "Object Detection", "Neural Networks", "Video Analysis"],
            averageSalary: "130000",
            growthRate: "23.8",
            demandScore: 9
          },
          
          // Cloud & Infrastructure
          {
            title: "Cloud Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Designs and manages cloud infrastructure and services",
            requiredSkills: ["AWS/Azure/GCP", "Infrastructure as Code", "Cloud Architecture", "Networking", "Security", "Containerization", "Automation", "Cost Optimization"],
            averageSalary: "115000",
            growthRate: "22.3",
            demandScore: 9
          },
          {
            title: "Cloud Architect",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Designs complex cloud infrastructure and migration strategies",
            requiredSkills: ["Cloud Services", "System Design", "Networking", "Security", "Disaster Recovery", "Cost Management", "Multi-cloud Strategies", "Compliance"],
            averageSalary: "145000",
            growthRate: "19.5",
            demandScore: 9
          },
          {
            title: "Cloud Security Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Secures cloud environments and ensures compliance with security standards",
            requiredSkills: ["Cloud Security", "Identity Management", "Compliance", "Network Security", "Security Automation", "Threat Detection", "Encryption", "Security Governance"],
            averageSalary: "135000",
            growthRate: "26.7",
            demandScore: 9
          },
          {
            title: "Solutions Architect",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Designs comprehensive technology solutions for specific business needs",
            requiredSkills: ["System Design", "Cloud Services", "Enterprise Architecture", "Technical Documentation", "Client Communication", "Business Requirements Analysis", "Technology Evaluation"],
            averageSalary: "140000",
            growthRate: "17.8",
            demandScore: 9
          },
          {
            title: "Infrastructure Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Designs and maintains computer networks and systems infrastructure",
            requiredSkills: ["Networking", "Server Administration", "Virtualization", "Storage Systems", "Disaster Recovery", "Monitoring", "Automation", "Security"],
            averageSalary: "105000",
            growthRate: "14.3",
            demandScore: 8
          },
          {
            title: "Systems Administrator",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Maintains and troubleshoots computer systems and servers",
            requiredSkills: ["Linux/Windows Administration", "Scripting", "Networking", "Security", "Backup & Recovery", "User Management", "Monitoring", "Troubleshooting"],
            averageSalary: "85000",
            growthRate: "8.5",
            demandScore: 7
          },
          {
            title: "Network Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Designs and implements computer networks",
            requiredSkills: ["Routing & Switching", "Network Protocols", "Security", "Troubleshooting", "Network Monitoring", "Wireless Networks", "Network Design", "VPN Technologies"],
            averageSalary: "95000",
            growthRate: "9.4",
            demandScore: 7
          },
          
          // Cybersecurity
          {
            title: "Security Analyst",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Monitors and analyzes security threats and implements protective measures",
            requiredSkills: ["Security Tools", "Threat Analysis", "Network Security", "Vulnerability Assessment", "Security Monitoring", "Incident Response", "Security Frameworks", "Risk Assessment"],
            averageSalary: "95000",
            growthRate: "28.2",
            demandScore: 9
          },
          {
            title: "Security Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Designs and implements security solutions and infrastructure",
            requiredSkills: ["Security Architecture", "Network Security", "Cloud Security", "Identity & Access Management", "Encryption", "Security Automation", "Penetration Testing", "Security Controls"],
            averageSalary: "120000",
            growthRate: "31.5",
            demandScore: 10
          },
          {
            title: "Penetration Tester",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Identifies and exploits security vulnerabilities to help improve security",
            requiredSkills: ["Ethical Hacking", "Security Tools", "Programming", "Network Security", "Web Application Security", "Social Engineering", "Vulnerability Research", "Exploitation Techniques"],
            averageSalary: "110000",
            growthRate: "29.4",
            demandScore: 9
          },
          {
            title: "Security Architect",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Designs secure information systems and infrastructure",
            requiredSkills: ["Security Architecture", "Risk Assessment", "Security Controls", "Identity & Access Management", "Network Security", "Cloud Security", "Security Governance", "Compliance"],
            averageSalary: "140000",
            growthRate: "25.8",
            demandScore: 9
          },
          {
            title: "Threat Intelligence Analyst",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Analyzes potential security threats and provides actionable intelligence",
            requiredSkills: ["Threat Analysis", "Intelligence Gathering", "Security Tools", "Malware Analysis", "Security Research", "Technical Writing", "OSINT", "Threat Modeling"],
            averageSalary: "100000",
            growthRate: "27.2",
            demandScore: 9
          },
          {
            title: "Incident Response Specialist",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Manages and responds to security incidents and breaches",
            requiredSkills: ["Incident Response", "Digital Forensics", "Malware Analysis", "Security Tools", "Crisis Management", "Documentation", "Recovery Procedures", "Root Cause Analysis"],
            averageSalary: "115000",
            growthRate: "32.0",
            demandScore: 10
          },
          {
            title: "GRC Specialist",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Manages governance, risk, and compliance for information security",
            requiredSkills: ["Risk Management", "Compliance Frameworks", "Security Policies", "Auditing", "Documentation", "Security Controls", "Regulations", "Risk Assessment"],
            averageSalary: "105000",
            growthRate: "20.5",
            demandScore: 8
          },
          {
            title: "Application Security Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Secures applications by identifying and fixing security vulnerabilities",
            requiredSkills: ["Secure Coding", "Code Review", "SAST/DAST Tools", "Web Security", "API Security", "Threat Modeling", "Authentication/Authorization", "Security Testing"],
            averageSalary: "125000",
            growthRate: "30.2",
            demandScore: 9
          },
          
          // Product & Project Management
          {
            title: "Product Manager",
            industry: "technology",
            level: "mid",
            roleType: "business",
            description: "Defines product vision and strategy and leads cross-functional teams",
            requiredSkills: ["Product Strategy", "Market Research", "User Experience", "Roadmapping", "Agile Methodologies", "Stakeholder Management", "Product Analytics", "Customer Feedback Analysis"],
            averageSalary: "125000",
            growthRate: "18.2",
            demandScore: 9
          },
          {
            title: "Technical Program Manager",
            industry: "technology",
            level: "senior",
            roleType: "business",
            description: "Manages complex technical programs involving multiple teams",
            requiredSkills: ["Program Management", "Technical Knowledge", "Risk Management", "Stakeholder Management", "Resource Planning", "Dependencies Management", "Project Tracking", "Communication"],
            averageSalary: "135000",
            growthRate: "16.8",
            demandScore: 8
          },
          {
            title: "Scrum Master",
            industry: "technology",
            level: "mid",
            roleType: "business",
            description: "Facilitates agile development processes and removes team obstacles",
            requiredSkills: ["Scrum Framework", "Agile Methodologies", "Facilitation", "Coaching", "Conflict Resolution", "Process Improvement", "Team Building", "Servant Leadership"],
            averageSalary: "105000",
            growthRate: "14.9",
            demandScore: 8
          },
          {
            title: "Agile Coach",
            industry: "technology",
            level: "senior",
            roleType: "business",
            description: "Guides organizations in adopting and improving agile practices",
            requiredSkills: ["Agile Frameworks", "Coaching", "Change Management", "Team Development", "Process Design", "Leadership", "Continuous Improvement", "Organizational Development"],
            averageSalary: "130000",
            growthRate: "15.7",
            demandScore: 8
          },
          {
            title: "Business Analyst",
            industry: "technology",
            level: "mid",
            roleType: "business",
            description: "Analyzes business needs and translates them into technical requirements",
            requiredSkills: ["Requirements Gathering", "Process Mapping", "Data Analysis", "User Stories", "Business Process Improvement", "Documentation", "Stakeholder Management", "Problem Solving"],
            averageSalary: "95000",
            growthRate: "12.8",
            demandScore: 8
          },
          
          // UI/UX & Design
          {
            title: "UI/UX Designer",
            industry: "technology",
            level: "mid",
            roleType: "creative",
            description: "Creates intuitive user interfaces and experiences for digital products",
            requiredSkills: ["UI Design", "UX Design", "User Research", "Wireframing", "Prototyping", "Design Systems", "Usability Testing", "Interaction Design"],
            averageSalary: "100000",
            growthRate: "16.2",
            demandScore: 8
          },
          {
            title: "Product Designer",
            industry: "technology",
            level: "senior",
            roleType: "creative",
            description: "Designs comprehensive digital products with focus on both function and form",
            requiredSkills: ["Design Thinking", "UI/UX Design", "User Research", "Product Strategy", "Information Architecture", "Design Systems", "Visual Design", "Prototyping"],
            averageSalary: "115000",
            growthRate: "17.5",
            demandScore: 9
          },
          {
            title: "UX Researcher",
            industry: "technology",
            level: "mid",
            roleType: "creative",
            description: "Conducts user research to inform product design decisions",
            requiredSkills: ["User Research", "Usability Testing", "Interviewing", "Data Analysis", "Persona Development", "Journey Mapping", "Research Planning", "Behavioral Analysis"],
            averageSalary: "105000",
            growthRate: "15.5",
            demandScore: 8
          },
          {
            title: "Visual Designer",
            industry: "technology",
            level: "mid",
            roleType: "creative",
            description: "Creates visually appealing designs for digital products and marketing",
            requiredSkills: ["Visual Design", "Typography", "Color Theory", "Branding", "Design Software", "Illustration", "Layout Design", "Digital Design"],
            averageSalary: "90000",
            growthRate: "12.3",
            demandScore: 7
          },
          {
            title: "Interaction Designer",
            industry: "technology",
            level: "mid",
            roleType: "creative",
            description: "Focuses on how users interact with digital products",
            requiredSkills: ["Interaction Design", "Prototyping", "Animation", "Micro-interactions", "User Flows", "Wireframing", "Information Architecture", "Usability"],
            averageSalary: "95000",
            growthRate: "14.2",
            demandScore: 8
          },
          {
            title: "Motion Designer",
            industry: "technology",
            level: "mid",
            roleType: "creative",
            description: "Creates animations and motion graphics for digital interfaces",
            requiredSkills: ["Motion Graphics", "Animation", "After Effects", "UI Animation", "Storyboarding", "Visual Design", "Timing & Easing", "Video Editing"],
            averageSalary: "85000",
            growthRate: "11.7",
            demandScore: 7
          },
          
          // Quality Assurance & Testing
          {
            title: "QA Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Ensures software quality through testing and quality processes",
            requiredSkills: ["Test Planning", "Test Case Design", "Defect Management", "Quality Processes", "Regression Testing", "Test Reporting", "QA Methodologies", "Software Life Cycle"],
            averageSalary: "85000",
            growthRate: "11.5",
            demandScore: 7
          },
          {
            title: "Automation Test Engineer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Develops and maintains automated tests for software applications",
            requiredSkills: ["Test Automation", "Selenium/Playwright", "Programming", "CI/CD", "Test Frameworks", "API Testing", "Test Design", "Performance Testing"],
            averageSalary: "95000",
            growthRate: "13.7",
            demandScore: 8
          },
          {
            title: "Manual Tester",
            industry: "technology",
            level: "junior",
            roleType: "technical",
            description: "Performs manual testing of software applications",
            requiredSkills: ["Manual Testing", "Test Cases", "Defect Reporting", "Exploratory Testing", "Regression Testing", "Test Documentation", "Quality Assurance", "User Acceptance Testing"],
            averageSalary: "70000",
            growthRate: "8.4",
            demandScore: 6
          },
          {
            title: "Performance Tester",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Tests software performance, load capacity, and scalability",
            requiredSkills: ["Performance Testing", "Load Testing", "Stress Testing", "Performance Tools", "Performance Analysis", "Bottleneck Identification", "Scalability Testing", "Performance Monitoring"],
            averageSalary: "100000",
            growthRate: "12.9",
            demandScore: 8
          },
          {
            title: "Security Tester",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Evaluates software security through specialized testing",
            requiredSkills: ["Security Testing", "Penetration Testing", "Vulnerability Assessment", "Security Tools", "OWASP", "Risk Assessment", "Security Standards", "Threat Modeling"],
            averageSalary: "115000",
            growthRate: "27.5",
            demandScore: 9
          },
          
          // Tech Support & Customer Success
          {
            title: "Technical Support Engineer",
            industry: "technology",
            level: "mid",
            roleType: "customer_facing",
            description: "Provides technical assistance to users and troubleshoots issues",
            requiredSkills: ["Technical Troubleshooting", "Customer Service", "Problem Solving", "Documentation", "Communication", "Product Knowledge", "Ticketing Systems", "User Training"],
            averageSalary: "75000",
            growthRate: "10.2",
            demandScore: 7
          },
          {
            title: "IT Support Specialist",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Provides technical support for internal systems and hardware",
            requiredSkills: ["Helpdesk Support", "Hardware Troubleshooting", "Software Support", "Networking", "User Account Management", "IT Security", "Desktop Support", "Remote Support Tools"],
            averageSalary: "65000",
            growthRate: "9.3",
            demandScore: 7
          },
          {
            title: "Customer Success Manager",
            industry: "technology",
            level: "mid",
            roleType: "customer_facing",
            description: "Ensures customers achieve desired outcomes with technology products",
            requiredSkills: ["Customer Relationship Management", "Product Knowledge", "Success Planning", "Onboarding", "Retention Strategies", "Business Acumen", "Upselling", "Account Management"],
            averageSalary: "90000",
            growthRate: "14.8",
            demandScore: 8
          },
          {
            title: "Solutions Consultant",
            industry: "technology",
            level: "senior",
            roleType: "customer_facing",
            description: "Provides technical expertise during sales process and implementation",
            requiredSkills: ["Technical Knowledge", "Solution Design", "Product Demonstration", "Needs Analysis", "Client Communication", "Project Planning", "Integration Knowledge", "Industry Expertise"],
            averageSalary: "110000",
            growthRate: "15.2",
            demandScore: 8
          },
          
          // Emerging Tech Roles
          {
            title: "Blockchain Developer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Develops blockchain applications and smart contracts",
            requiredSkills: ["Blockchain Platforms", "Smart Contracts", "Solidity", "Cryptography", "Distributed Systems", "Web3", "Security", "Consensus Mechanisms"],
            averageSalary: "120000",
            growthRate: "24.5",
            demandScore: 8
          },
          {
            title: "AR/VR Developer",
            industry: "technology",
            level: "mid",
            roleType: "technical",
            description: "Creates augmented and virtual reality experiences",
            requiredSkills: ["Unity/Unreal", "3D Modeling", "AR/VR SDKs", "UI/UX for Immersive", "Performance Optimization", "Spatial Computing", "Computer Vision", "3D Mathematics"],
            averageSalary: "105000",
            growthRate: "22.7",
            demandScore: 8
          },
          {
            title: "Quantum Computing Researcher",
            industry: "technology",
            level: "senior",
            roleType: "research",
            description: "Researches quantum computing algorithms and applications",
            requiredSkills: ["Quantum Mechanics", "Quantum Algorithms", "Programming", "Mathematics", "Physics", "Quantum Frameworks", "Research Methods", "Academic Writing"],
            averageSalary: "140000",
            growthRate: "17.3",
            demandScore: 7
          },
          {
            title: "Robotics Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Designs and builds robots and robotic systems",
            requiredSkills: ["Robotics", "Control Systems", "Computer Vision", "Sensors", "Programming", "Mechanical Design", "Electrical Engineering", "Simulation"],
            averageSalary: "115000",
            growthRate: "15.6",
            demandScore: 7
          },
          {
            title: "Edge Computing Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Develops systems that process data near the source of generation",
            requiredSkills: ["Distributed Systems", "IoT", "Networking", "Real-time Processing", "Security", "Low-latency Computing", "Embedded Systems", "Cloud Integration"],
            averageSalary: "120000",
            growthRate: "19.8",
            demandScore: 8
          },
          
          // Sales, Marketing, and Evangelism
          {
            title: "Technical Sales Engineer",
            industry: "technology",
            level: "mid",
            roleType: "customer_facing",
            description: "Provides technical expertise to support sales of complex products",
            requiredSkills: ["Technical Knowledge", "Sales Process", "Product Demonstrations", "Solution Design", "Customer Communication", "Needs Analysis", "Technical Presentations", "Competitive Analysis"],
            averageSalary: "110000",
            growthRate: "14.2",
            demandScore: 8
          },
          {
            title: "Solutions Engineer",
            industry: "technology",
            level: "senior",
            roleType: "technical",
            description: "Designs and demonstrates technical solutions for prospects and customers",
            requiredSkills: ["Solution Architecture", "Product Knowledge", "Technical Demonstrations", "Proof of Concept", "Integration Expertise", "Client Communication", "Problem Solving", "Technical Writing"],
            averageSalary: "125000",
            growthRate: "16.3",
            demandScore: 8
          },
          {
            title: "Developer Advocate",
            industry: "technology",
            level: "mid",
            roleType: "customer_facing",
            description: "Represents developers' interests and promotes technology adoption",
            requiredSkills: ["Development Experience", "Community Building", "Public Speaking", "Technical Writing", "Social Media", "Content Creation", "Workshop Facilitation", "Technical Demonstrations"],
            averageSalary: "115000",
            growthRate: "17.9",
            demandScore: 8
          },
          {
            title: "Tech Marketing Manager",
            industry: "technology",
            level: "senior",
            roleType: "business",
            description: "Develops marketing strategies for technology products and services",
            requiredSkills: ["Technical Understanding", "Marketing Strategy", "Product Positioning", "Content Marketing", "Digital Marketing", "Campaign Management", "Analytics", "Market Research"],
            averageSalary: "120000",
            growthRate: "13.8",
            demandScore: 8
          },
          {
            title: "Pre-Sales Consultant",
            industry: "technology",
            level: "mid",
            roleType: "customer_facing",
            description: "Provides technical expertise during sales process",
            requiredSkills: ["Technical Knowledge", "Demonstrations", "Solution Design", "Requirements Gathering", "RFP Response", "Technical Presentations", "Proof of Concept", "Competitive Analysis"],
            averageSalary: "105000",
            growthRate: "15.1",
            demandScore: 8
          }
        ];
        
        // Insert the tech roles
        const createdRoles = [];
        for (const role of updatedTechRoles) {
          const newRole = await storage.createInterviewRole(role);
          createdRoles.push(newRole);
        }
        
        res.status(200).json({
          message: "Technology industry roles updated successfully",
          count: createdRoles.length,
          roles: createdRoles
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new interview question
  app.post(
    "/api/interview/questions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const questionDataResult = insertInterviewQuestionSchema.safeParse(req.body);
        if (!questionDataResult.success) {
          return res.status(400).json({
            message: "Invalid interview question data",
            errors: questionDataResult.error.errors,
          });
        }

        const newQuestion = await storage.createInterviewQuestion(questionDataResult.data);
        res.status(201).json(newQuestion);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get user's interview sessions
  app.get(
    "/api/users/:userId/interview-sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        
        const sessions = await storage.getInterviewSessionsByUserId(userId);
        res.json(sessions);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get a specific interview session
  app.get(
    "/api/interview/sessions/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sessionId = parseInt(req.params.id);
        const session = await storage.getInterviewSession(sessionId);
        
        if (!session) {
          return res.status(404).json({ message: "Interview session not found" });
        }
        
        res.json(session);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new interview session
  app.post(
    "/api/interview/sessions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sessionDataResult = insertInterviewSessionSchema.safeParse(req.body);
        if (!sessionDataResult.success) {
          return res.status(400).json({
            message: "Invalid interview session data",
            errors: sessionDataResult.error.errors,
          });
        }

        const newSession = await storage.createInterviewSession(sessionDataResult.data);
        
        // Create activity entry for completing an interview session
        await storage.createUserActivity({
          userId: sessionDataResult.data.userId,
          activityType: "interview_session",
          description: `Completed interview session for role ID: ${sessionDataResult.data.roleId}`,
          metadata: { sessionId: newSession.id }
        });

        res.status(201).json(newSession);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get questions for a mock interview
  app.get(
    "/api/interview/mock-questions",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { roleId, difficulty, count = "5" } = req.query;
        
        if (!roleId) {
          return res.status(400).json({ message: "Role ID is required" });
        }
        
        const numQuestions = parseInt(count as string);
        const parsedRoleId = parseInt(roleId as string);
        
        let questions;
        
        if (difficulty) {
          // Get questions by role
          const roleQuestions = await storage.getInterviewQuestionsByRole(parsedRoleId);
          // Filter by difficulty
          questions = roleQuestions.filter(q => q.difficulty === difficulty);
        } else {
          questions = await storage.getInterviewQuestionsByRole(parsedRoleId);
        }
        
        // If we have more questions than requested, select random ones
        if (questions.length > numQuestions) {
          // Shuffle array and take the first 'numQuestions' items
          questions = questions
            .sort(() => 0.5 - Math.random())
            .slice(0, numQuestions);
        }
        
        res.json(questions);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create sample interview data
  app.post(
    "/api/interview/create-samples",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Create sample interview roles if none exist
        const existingRoles = await storage.getAllInterviewRoles();
        
        if (existingRoles.length === 0) {
          console.log("Creating sample interview roles...");
          
          const sampleRoles = [
            // Tech Industry Roles
            {
              title: "Frontend Developer",
              industry: "Tech",
              level: "Junior",
              roleType: "technical",
              description: "Entry-level position focused on UI/UX implementation",
              requiredSkills: ["JavaScript", "HTML", "CSS", "React", "Responsive Design", "Git", "Browser DevTools", "Performance Optimization"],
              averageSalary: "65000",
              growthRate: "12.2",
              demandScore: 8
            },
            {
              title: "Backend Developer",
              industry: "Tech",
              level: "Mid-level",
              roleType: "technical",
              description: "Backend developer with focus on API design and implementation",
              requiredSkills: ["Node.js", "Express", "SQL", "REST APIs", "Database Design", "Authentication", "Security", "Performance Optimization", "Docker"],
              averageSalary: "95000",
              growthRate: "14.5",
              demandScore: 9
            },
            {
              title: "Full Stack Developer",
              industry: "Tech",
              level: "Senior",
              roleType: "technical",
              description: "Senior developer proficient in both frontend and backend technologies",
              requiredSkills: ["JavaScript", "React", "Node.js", "SQL", "System Design", "Cloud Services", "API Design", "Performance Optimization", "Security", "Team Leadership"],
              averageSalary: "130000",
              growthRate: "15.8",
              demandScore: 9
            },
            {
              title: "Data Scientist",
              industry: "Tech",
              level: "Mid-level",
              roleType: "technical",
              description: "Data scientist with focus on analysis and machine learning",
              requiredSkills: ["Python", "SQL", "Machine Learning", "Data Visualization", "Statistical Analysis", "Deep Learning", "Natural Language Processing", "Data Engineering", "ETL Processes"],
              averageSalary: "115000",
              growthRate: "22.0",
              demandScore: 9
            },
            // Finance Industry Roles
            {
              title: "Financial Analyst",
              industry: "Finance",
              level: "Mid-level",
              roleType: "finance",
              description: "Analyzes financial data to help companies make investment decisions",
              requiredSkills: ["Financial Modeling", "Excel", "Financial Statement Analysis", "Forecasting", "Valuation Methods", "Industry Research", "Data Analysis", "Statistical Software"],
              averageSalary: "85000",
              growthRate: "10.5",
              demandScore: 8
            },
            {
              title: "Investment Banker",
              industry: "Finance",
              level: "Senior",
              roleType: "finance",
              description: "Advises clients on financial transactions, mergers, and acquisitions",
              requiredSkills: ["Financial Modeling", "Valuation", "Deal Structuring", "Negotiations", "Client Relationship Management", "Industry Knowledge", "Corporate Finance", "Capital Markets"],
              averageSalary: "150000",
              growthRate: "8.0",
              demandScore: 7
            },
            // Healthcare Industry Roles
            {
              title: "Clinical Research Coordinator",
              industry: "Healthcare",
              level: "Mid-level",
              roleType: "healthcare",
              description: "Coordinates and manages clinical trials and research studies",
              requiredSkills: ["Clinical Trial Management", "Medical Terminology", "Regulatory Compliance", "Data Collection", "Patient Recruitment", "IRB Protocols", "Good Clinical Practice", "Electronic Medical Records"],
              averageSalary: "70000",
              growthRate: "11.2",
              demandScore: 8
            },
            {
              title: "Healthcare Administrator",
              industry: "Healthcare",
              level: "Senior",
              roleType: "healthcare",
              description: "Manages healthcare facilities and ensures efficient operations",
              requiredSkills: ["Healthcare Regulations", "Policy Development", "Budget Management", "Staff Supervision", "Quality Improvement", "Healthcare IT Systems", "Strategic Planning", "Operations Management"],
              averageSalary: "110000",
              growthRate: "13.0",
              demandScore: 8
            },
            // Education Industry Roles
            {
              title: "Instructional Designer",
              industry: "Education",
              level: "Mid-level",
              roleType: "education",
              description: "Develops educational content and learning experiences",
              requiredSkills: ["Learning Experience Design", "Curriculum Development", "E-Learning Tools", "Assessment Design", "Educational Technology", "Adult Learning Theory", "Multimedia Content Creation", "Project Management"],
              averageSalary: "75000",
              growthRate: "10.0",
              demandScore: 7
            },
            {
              title: "EdTech Product Manager",
              industry: "Education",
              level: "Senior",
              roleType: "education",
              description: "Manages the development and implementation of educational technology products",
              requiredSkills: ["Product Management", "Educational Technology", "User Research", "Product Roadmapping", "Agile Methodologies", "Learning Experience Design", "Data Analytics", "Market Research"],
              averageSalary: "105000",
              growthRate: "14.5",
              demandScore: 8
            },
            // Marketing Industry Roles
            {
              title: "Digital Marketing Specialist",
              industry: "Marketing",
              level: "Mid-level",
              roleType: "marketing",
              description: "Plans and executes digital marketing strategies across various platforms",
              requiredSkills: ["SEO", "SEM", "Social Media Marketing", "Content Marketing", "Email Marketing", "Analytics Tools", "A/B Testing", "Campaign Management", "Marketing Automation"],
              averageSalary: "72000",
              growthRate: "16.2",
              demandScore: 8
            },
            {
              title: "Brand Manager",
              industry: "Marketing",
              level: "Senior",
              roleType: "marketing",
              description: "Develops and implements brand strategies to increase brand value and recognition",
              requiredSkills: ["Brand Strategy", "Market Research", "Consumer Behavior", "Campaign Management", "Creative Direction", "Budget Management", "Stakeholder Management", "Content Strategy", "Competitive Analysis"],
              averageSalary: "110000",
              growthRate: "9.8",
              demandScore: 7
            },
            // Design Industry Roles
            {
              title: "UX/UI Designer",
              industry: "Design",
              level: "Mid-level",
              roleType: "creative",
              description: "Creates user-centered designs for digital products and experiences",
              requiredSkills: ["User Research", "Wireframing", "Prototyping", "Usability Testing", "Information Architecture", "Visual Design", "Design Systems", "Figma/Sketch/Adobe XD", "Interaction Design"],
              averageSalary: "90000",
              growthRate: "18.5",
              demandScore: 9
            },
            {
              title: "Product Designer",
              industry: "Design",
              level: "Senior",
              roleType: "creative",
              description: "Designs end-to-end product experiences combining UX, visual design, and product thinking",
              requiredSkills: ["Design Systems", "User-Centered Design", "Prototyping", "Interaction Design", "Visual Design", "User Research", "Design Thinking", "A/B Testing", "Cross-functional Collaboration"],
              averageSalary: "120000",
              growthRate: "15.0",
              demandScore: 8
            },
            // Data Industry Roles
            {
              title: "Data Analyst",
              industry: "Tech",
              level: "Mid-level",
              roleType: "technical",
              description: "Analyzes complex data sets to identify trends and insights for business decision-making",
              requiredSkills: ["SQL", "Data Visualization", "Excel/Sheets", "Statistical Analysis", "Python/R", "Business Intelligence Tools", "Critical Thinking", "Data Cleaning", "Dashboard Design"],
              averageSalary: "80000",
              growthRate: "20.0",
              demandScore: 9
            },
            {
              title: "Data Engineer",
              industry: "Tech",
              level: "Senior",
              roleType: "technical",
              description: "Builds and maintains data pipelines and infrastructure for data processing",
              requiredSkills: ["Big Data Technologies", "ETL Processes", "SQL", "NoSQL Databases", "Data Warehouse Solutions", "Python/Scala", "Cloud Platforms", "Data Modeling", "Distributed Computing"],
              averageSalary: "125000",
              growthRate: "25.5",
              demandScore: 9
            },
            // Product Management Roles
            {
              title: "Product Manager",
              industry: "Tech",
              level: "Mid-level",
              roleType: "business",
              description: "Manages product development from conception to launch, balancing business needs with user experience",
              requiredSkills: ["Product Strategy", "User Research", "Market Analysis", "Roadmapping", "Agile Methodologies", "Stakeholder Management", "Data Analysis", "Prioritization", "Technical Understanding"],
              averageSalary: "110000",
              growthRate: "17.0",
              demandScore: 9
            },
            {
              title: "Senior Product Manager",
              industry: "Tech",
              level: "Senior",
              roleType: "business",
              description: "Leads complex product initiatives, driving vision and strategy across multiple teams",
              requiredSkills: ["Product Strategy", "Team Leadership", "Market Research", "Business Model Development", "Stakeholder Management", "KPI Definition", "Product Analytics", "Cross-functional Leadership", "User Experience Design"],
              averageSalary: "140000",
              growthRate: "14.5",
              demandScore: 8
            },
            // Legal Industry Roles
            {
              title: "Legal Associate",
              industry: "Legal",
              level: "Mid-level",
              roleType: "legal",
              description: "Provides legal support and conducts research for cases and transactions",
              requiredSkills: ["Legal Research", "Contract Review", "Legal Writing", "Case Analysis", "Client Communication", "Legal Documentation", "Regulatory Compliance", "Litigation Support", "Legal Technology"],
              averageSalary: "95000",
              growthRate: "8.5",
              demandScore: 7
            },
            {
              title: "Corporate Counsel",
              industry: "Legal",
              level: "Senior",
              roleType: "legal",
              description: "Advises organizations on legal matters and ensures compliance with laws and regulations",
              requiredSkills: ["Corporate Law", "Contract Negotiation", "Regulatory Compliance", "Risk Assessment", "Intellectual Property", "Employment Law", "Dispute Resolution", "Business Acumen", "Legal Strategy"],
              averageSalary: "145000",
              growthRate: "7.0",
              demandScore: 7
            },
            // Consulting Industry Roles
            {
              title: "Management Consultant",
              industry: "Consulting",
              level: "Mid-level",
              roleType: "business",
              description: "Helps organizations improve performance and solve business challenges",
              requiredSkills: ["Business Analysis", "Problem Solving", "Strategic Thinking", "Project Management", "Client Management", "Data Analysis", "Research", "Process Improvement", "Presentation Skills"],
              averageSalary: "105000",
              growthRate: "11.0",
              demandScore: 8
            },
            {
              title: "Strategy Consultant",
              industry: "Consulting",
              level: "Senior",
              roleType: "business",
              description: "Advises organizations on high-level strategic decisions and initiatives",
              requiredSkills: ["Strategic Planning", "Market Analysis", "Financial Modeling", "Competitive Analysis", "Business Case Development", "Executive Communication", "Industry Knowledge", "Change Management", "Due Diligence"],
              averageSalary: "155000",
              growthRate: "9.5",
              demandScore: 8
            },
            // Operations Industry Roles
            {
              title: "Operations Manager",
              industry: "Operations",
              level: "Mid-level",
              roleType: "operations",
              description: "Oversees daily operations and ensures efficiency in production or service delivery",
              requiredSkills: ["Process Optimization", "Team Management", "Resource Allocation", "Performance Metrics", "Quality Control", "Project Management", "Supply Chain Knowledge", "Continuous Improvement", "Problem Solving"],
              averageSalary: "85000",
              growthRate: "9.0",
              demandScore: 7
            },
            {
              title: "Supply Chain Manager",
              industry: "Operations",
              level: "Senior",
              roleType: "operations",
              description: "Oversees the end-to-end supply chain process from suppliers to customers",
              requiredSkills: ["Supply Chain Management", "Logistics", "Inventory Management", "Demand Planning", "Vendor Management", "Cost Optimization", "Risk Management", "ERP Systems", "Global Trade Knowledge"],
              averageSalary: "115000",
              growthRate: "10.5",
              demandScore: 8
            },
            // Human Resources Roles
            {
              title: "HR Business Partner",
              industry: "Human Resources",
              level: "Mid-level",
              roleType: "human_resources",
              description: "Partners with business units to develop and implement HR strategies",
              requiredSkills: ["Employee Relations", "Performance Management", "Talent Development", "HR Policies", "Change Management", "Business Acumen", "Conflict Resolution", "Recruitment", "Employee Engagement"],
              averageSalary: "90000",
              growthRate: "8.5",
              demandScore: 7
            },
            {
              title: "Talent Acquisition Manager",
              industry: "Human Resources",
              level: "Senior",
              roleType: "human_resources",
              description: "Leads recruitment strategies and processes to attract and hire top talent",
              requiredSkills: ["Recruitment Strategy", "Candidate Assessment", "Employer Branding", "ATS Systems", "Interview Techniques", "Market Analysis", "Diversity & Inclusion", "Negotiation", "Talent Pipeline Development"],
              averageSalary: "105000",
              growthRate: "9.0",
              demandScore: 7
            },
            // Research Industry Roles
            {
              title: "Research Scientist",
              industry: "Research",
              level: "Mid-level",
              roleType: "research",
              description: "Conducts scientific research and experiments to advance knowledge in a specialized field",
              requiredSkills: ["Research Methodology", "Statistical Analysis", "Scientific Writing", "Data Collection", "Experiment Design", "Literature Review", "Research Ethics", "Grant Writing", "Problem Solving"],
              averageSalary: "95000",
              growthRate: "10.0",
              demandScore: 7
            },
            {
              title: "Principal Researcher",
              industry: "Research",
              level: "Senior",
              roleType: "research",
              description: "Leads research programs and teams to explore new frontiers in a scientific domain",
              requiredSkills: ["Advanced Research Methods", "Team Leadership", "Research Strategy", "Publishing", "Grant Management", "Interdisciplinary Collaboration", "Mentoring", "Technical Expertise", "Research Program Development"],
              averageSalary: "135000",
              growthRate: "8.5",
              demandScore: 7
            },
            // Cybersecurity Industry Roles
            {
              title: "Cybersecurity Analyst",
              industry: "Tech",
              level: "Mid-level",
              roleType: "technical",
              description: "Protects computer systems and networks from cyber threats and security breaches",
              requiredSkills: ["Network Security", "Vulnerability Assessment", "Security Monitoring", "Incident Response", "Security Tools", "Threat Intelligence", "Security Compliance", "Risk Assessment", "Security Protocols"],
              averageSalary: "95000",
              growthRate: "31.0",
              demandScore: 10
            },
            {
              title: "Security Architect",
              industry: "Tech",
              level: "Senior",
              roleType: "technical",
              description: "Designs and implements secure computer systems, networks, and architectures",
              requiredSkills: ["Security Architecture", "Security Frameworks", "Risk Management", "Identity & Access Management", "Security Controls", "Network Architecture", "Cloud Security", "Security Governance", "Cryptography"],
              averageSalary: "140000",
              growthRate: "25.0",
              demandScore: 9
            },
            // Cloud Computing Roles
            {
              title: "Cloud Engineer",
              industry: "Tech",
              level: "Mid-level",
              roleType: "technical",
              description: "Designs, implements, and manages cloud-based systems and infrastructure",
              requiredSkills: ["Cloud Platforms (AWS/Azure/GCP)", "Infrastructure as Code", "Containerization", "CI/CD Pipelines", "Serverless Architecture", "Cloud Security", "Networking", "Monitoring & Logging", "Scripting"],
              averageSalary: "115000",
              growthRate: "22.0",
              demandScore: 9
            },
            {
              title: "Cloud Architect",
              industry: "Tech",
              level: "Senior",
              roleType: "technical",
              description: "Designs and oversees cloud computing strategies and solutions for organizations",
              requiredSkills: ["Multi-Cloud Strategy", "Solution Architecture", "Cloud Migration", "Distributed Systems", "Cost Optimization", "Security Architecture", "Performance Tuning", "Enterprise Integration", "Governance"],
              averageSalary: "150000",
              growthRate: "20.0",
              demandScore: 9
            }
          ];
          
          const createdRoles = [];
          for (const role of sampleRoles) {
            const newRole = await storage.createInterviewRole(role);
            createdRoles.push(newRole);
          }
          
          // Create sample questions for each role
          const sampleQuestions = [
            // Frontend Developer Questions
            {
              roleId: 1,
              category: "Technical",
              difficulty: "Easy",
              question: "Explain the difference between let, const, and var in JavaScript.",
              expectedAnswerPoints: [
                "var is function-scoped, while let and const are block-scoped",
                "const prevents reassignment of the variable",
                "var variables are hoisted and initialized with undefined",
                "let and const are hoisted but not initialized (temporal dead zone)"
              ],
              sampleAnswer: "In JavaScript, var, let, and const are used for variable declarations but have different scoping and reassignment behaviors. var is function-scoped and gets hoisted with a value of undefined. let and const are block-scoped (available only within the block they're defined) and are hoisted but not initialized, creating a temporal dead zone. The key difference between let and const is that const prevents variable reassignment after initialization, though for objects and arrays, their properties can still be modified as the reference itself is constant, not the content.",
              relatedSkillIds: ["JavaScript", "ES6"]
            },
            {
              roleId: 1,
              category: "Technical",
              difficulty: "Medium",
              question: "What is the virtual DOM in React and why is it important?",
              expectedAnswerPoints: [
                "The virtual DOM is a lightweight copy of the actual DOM",
                "React uses it to minimize expensive DOM operations",
                "React compares virtual DOM with previous versions to determine what needs to change",
                "This approach improves performance by batching DOM updates"
              ],
              sampleAnswer: "The Virtual DOM in React is a lightweight, in-memory representation of the real DOM. When state changes in a React application, React first updates this virtual representation and then compares it with the previous version using a diffing algorithm. This process identifies the minimal set of changes needed to update the actual DOM. This approach is important because direct DOM manipulation is slow and inefficient. By batching changes and updating only what's necessary, React significantly improves performance, especially in complex applications with frequent updates. Additionally, the Virtual DOM abstraction allows React to work across different rendering environments, not just browsers.",
              relatedSkillIds: ["React", "JavaScript", "Frontend Optimization"]
            },
            {
              roleId: 1,
              category: "Problem Solving",
              difficulty: "Hard",
              question: "How would you implement a responsive image gallery with lazy loading?",
              expectedAnswerPoints: [
                "Use CSS Grid or Flexbox for responsive layout",
                "Implement Intersection Observer API for lazy loading",
                "Consider fallbacks for older browsers",
                "Discuss image optimization techniques",
                "Handle loading states and errors"
              ],
              sampleAnswer: "To implement a responsive image gallery with lazy loading, I'd start with a responsive grid layout using CSS Grid or Flexbox with percentage-based dimensions and media queries to adjust columns based on viewport width. For lazy loading, I'd use the Intersection Observer API to detect when images enter the viewport. Each image would initially have a lightweight placeholder or blur-up preview, with the src attribute loaded only when the image approaches the viewport. I'd implement loading indicators and error states for better UX. For older browsers, I'd provide a fallback using scroll event listeners with debouncing. Image optimization would include serving properly sized images using srcset and sizes attributes, modern formats like WebP with fallbacks, and potentially a CDN for delivery. Finally, I'd ensure accessibility with proper alt text, keyboard navigation, and maintaining focus states.",
              relatedSkillIds: ["HTML", "CSS", "JavaScript", "Performance Optimization"]
            },
            // Backend Developer Questions
            {
              roleId: 2,
              category: "Technical",
              difficulty: "Medium",
              question: "Explain RESTful API design principles and best practices.",
              expectedAnswerPoints: [
                "Use standard HTTP methods (GET, POST, PUT, DELETE)",
                "Use nouns for resources, not verbs",
                "Implement proper status codes",
                "Version your APIs",
                "Use pagination for large resources",
                "Implement proper error handling"
              ],
              sampleAnswer: "RESTful API design centers around resources, identified by URLs, that can be manipulated using standard HTTP methods. GET retrieves resources, POST creates them, PUT updates them, and DELETE removes them. Best practices include: using plural nouns for resource endpoints (e.g., /users, not /user); implementing proper HTTP status codes (200 for success, 400 for client errors, 500 for server errors); using query parameters for filtering and pagination; versioning APIs to maintain backward compatibility (e.g., /v1/resources); implementing consistent error responses with meaningful messages; using nested routes sparingly for related resources; and documenting thoroughly with tools like Swagger. Security considerations include using HTTPS, implementing authentication/authorization, rate limiting, and validating inputs. A well-designed REST API should be intuitive, consistent, and follow the HATEOAS principle to make API navigation discoverable.",
              relatedSkillIds: ["API Design", "REST", "Backend Development"]
            },
            {
              roleId: 2,
              category: "Technical",
              difficulty: "Hard",
              question: "How would you handle database transactions in a distributed system?",
              expectedAnswerPoints: [
                "Discuss ACID properties",
                "Explain distributed transaction patterns (2PC, saga)",
                "Cover eventual consistency",
                "Mention challenges like network partitions",
                "Discuss compensation/rollback strategies"
              ],
              sampleAnswer: "Managing transactions in distributed systems requires balancing consistency with availability and partition tolerance. While traditional systems rely on ACID properties, distributed systems often use the Two-Phase Commit (2PC) protocol where a coordinator ensures all participants can commit before finalizing, though this can create performance bottlenecks and availability issues. Modern systems frequently employ the Saga pattern, breaking transactions into smaller local transactions with compensating actions for failures. Event-driven architectures with eventual consistency are also common, prioritizing availability over immediate consistency. For implementation, I'd consider factors like business requirements for consistency vs. availability, expected transaction volumes, and failure scenarios. Challenges include handling network partitions, partial failures, and duplicate messages. Monitoring is crucial for detecting anomalies, with strategies like distributed tracing helping track transactions across services. The right approach ultimately depends on specific system requirements and constraints.",
              relatedSkillIds: ["Database Design", "Distributed Systems", "System Architecture"]
            },
            // Full Stack Developer Questions
            {
              roleId: 3,
              category: "System Design",
              difficulty: "Hard",
              question: "Design a real-time collaborative document editing system like Google Docs.",
              expectedAnswerPoints: [
                "Discuss operational transformation or CRDT for conflict resolution",
                "Cover WebSockets for real-time communication",
                "Explain persistence strategy",
                "Address user presence and cursors",
                "Cover authentication and permissions",
                "Discuss scalability challenges"
              ],
              sampleAnswer: "For a real-time collaborative document editor like Google Docs, I'd design a system with client and server components communicating via WebSockets for low-latency updates. At its core would be either Operational Transformation (OT) or Conflict-free Replicated Data Types (CRDTs) to handle concurrent edits and ensure eventual consistency. The architecture would include a web client using a rich text editor framework, an authentication service, a document service for storage and retrieval, and a collaboration service handling real-time synchronization and conflict resolution. For scalability, I'd implement horizontal scaling of WebSocket servers with Redis or Kafka for pub/sub messaging, database sharding, and caching. Features would include user presence indicators, cursor positions, version history, permissions management, and offline editing with conflict resolution upon reconnection. For large documents, I'd implement pagination or chunking, and use a NoSQL database for flexible schema evolution. The system would need comprehensive logging, monitoring, and analytics to track performance metrics and user behavior patterns.",
              relatedSkillIds: ["System Design", "WebSockets", "Database Design", "Frontend Development"]
            },
            // Data Scientist Questions
            {
              roleId: 4,
              category: "Technical",
              difficulty: "Medium",
              question: "Explain the difference between supervised and unsupervised learning with examples.",
              expectedAnswerPoints: [
                "Supervised learning uses labeled data",
                "Unsupervised learning works with unlabeled data",
                "Examples of supervised: classification, regression",
                "Examples of unsupervised: clustering, dimensionality reduction",
                "Discuss when to use each approach"
              ],
              sampleAnswer: "Supervised learning uses labeled data where we have both input features and target outputs. The algorithm learns to map inputs to correct outputs, essentially learning from a 'teacher' (the labels). Common examples include classification (predicting categories like spam detection) and regression (predicting continuous values like house prices). Models like Decision Trees, Random Forests, and Neural Networks are often used. In contrast, unsupervised learning works with unlabeled data, identifying patterns or structures without guidance. Examples include clustering (grouping similar data points, like customer segmentation), dimensionality reduction (like PCA to reduce features while preserving information), and association rule learning (finding relationships between variables). Semi-supervised learning bridges these approaches by using both labeled and unlabeled data, especially useful when labeling is expensive. The choice between methods depends on data availability, problem type, and business goals - supervised for prediction tasks with sufficient labeled data, unsupervised for exploration or when labels aren't available.",
              relatedSkillIds: ["Machine Learning", "Data Science", "Statistics"]
            }
          ];
          
          const createdQuestions = [];
          for (const question of sampleQuestions) {
            const newQuestion = await storage.createInterviewQuestion(question);
            createdQuestions.push(newQuestion);
          }
          
          res.status(201).json({
            message: "Sample interview data created successfully",
            roles: createdRoles,
            questions: createdQuestions
          });
        } else {
          res.json({
            message: "Sample data already exists",
            rolesCount: existingRoles.length
          });
        }
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================
  // Career Path Routes
  // =====================

  // Get all career paths
  app.get(
    "/api/career/paths",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const careerPaths = await storage.getAllCareerPaths();
        res.json(careerPaths);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get a specific career path
  app.get(
    "/api/career/paths/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathId = parseInt(req.params.id);
        const careerPath = await storage.getCareerPath(pathId);
        
        if (!careerPath) {
          return res.status(404).json({ message: "Career path not found" });
        }
        
        res.json(careerPath);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get career path by role ID
  app.get(
    "/api/career/paths/role/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.roleId);
        const careerPath = await storage.getCareerPathByRoleId(roleId);
        
        if (!careerPath) {
          return res.status(404).json({ message: "Career path not found for this role" });
        }
        
        // For UI display purposes, we can enhance the career path with additional information
        // This would come from a real database in production, but for now we'll add mock data
        // if UI fields are requested in the query parameter
        const { enhanceForUI } = req.query;
        
        if (enhanceForUI === 'true') {
          // The frontend expects pathSteps and resources for visualization
          const enhancedPath = {
            ...careerPath,
            pathSteps: [
              {
                title: careerPath.previousRole || "Entry Level Position",
                subtitle: "Previous Role",
                description: "Starting point in the career journey",
                timeEstimate: "1-2 years",
                keySkills: careerPath.skillsToAcquire?.slice(0, 2) || ["Communication", "Basic technical skills"]
              },
              {
                title: "Current Role",
                subtitle: "Where you are now",
                description: "Solidify your knowledge and expand your skills",
                timeEstimate: `${careerPath.yearsToProgress || 2}-3 years`,
                keySkills: careerPath.skillsToAcquire?.slice(2, 4) || ["Specialized knowledge", "Project management"]
              },
              {
                title: careerPath.nextRole || "Senior Position",
                subtitle: "Future Opportunity",
                description: "Next step in your career progression",
                timeEstimate: "2-4 years",
                keySkills: careerPath.skillsToAcquire?.slice(4) || ["Leadership", "Strategic thinking"]
              }
            ],
            resources: [
              {
                title: "Career Development Workshop",
                provider: "Upcraft Academy",
                type: "workshop",
                url: "https://example.com/workshops/career-development"
              },
              {
                title: "Leadership Essentials",
                provider: "Skill Masters",
                type: "course",
                url: "https://example.com/courses/leadership"
              },
              {
                title: "Technical Skills Assessment",
                provider: "Upcraft",
                type: "assessment",
                url: "https://example.com/assessments/technical"
              }
            ]
          };
          
          return res.json(enhancedPath);
        }
        
        res.json(careerPath);
      } catch (error) {
        next(error);
      }
    }
  );

  // Create a new career path
  app.post(
    "/api/career/paths",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathDataResult = insertCareerPathSchema.safeParse(req.body);
        if (!pathDataResult.success) {
          return res.status(400).json({
            message: "Invalid career path data",
            errors: pathDataResult.error.errors,
          });
        }

        const newPath = await storage.createCareerPath(pathDataResult.data);
        res.status(201).json(newPath);
      } catch (error) {
        next(error);
      }
    }
  );

  // Update a career path
  app.patch(
    "/api/career/paths/:id",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathId = parseInt(req.params.id);
        const existingPath = await storage.getCareerPath(pathId);
        
        if (!existingPath) {
          return res.status(404).json({ message: "Career path not found" });
        }
        
        const updatedPath = await storage.updateCareerPath(pathId, req.body);
        res.json(updatedPath);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete a career path
  app.delete(
    "/api/career/paths/:id",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pathId = parseInt(req.params.id);
        const existingPath = await storage.getCareerPath(pathId);
        
        if (!existingPath) {
          return res.status(404).json({ message: "Career path not found" });
        }
        
        await storage.deleteCareerPath(pathId);
        res.status(204).end();
      } catch (error) {
        next(error);
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
