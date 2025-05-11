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

// Helper function to format timeline months in a human-readable way
function formatTimelineMonths(months: number): string {
  if (months < 12) {
    return `${months} months`;
  } else if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    return `${months} months`;
  }
}

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

// Helper function to generate role-specific skills based on role title and industry
function generateRoleSpecificSkills(roleTitle: string, industry: string): Array<{
  name: string;
  category: string;
  description?: string;
}> {
  const roleTitleLower = roleTitle.toLowerCase();
  const industryLower = industry?.toLowerCase() || "";
  
  // Default categories
  const technicalCategory = "Technical Skills";
  const softCategory = "Soft Skills";
  const domainCategory = "Domain Knowledge";
  const toolsCategory = "Tools & Technologies";
  const managementCategory = "Management Skills";
  
  // Common soft skills that apply to most roles
  const commonSoftSkills = [
    { name: "Communication", category: softCategory, description: "Ability to communicate clearly and effectively with team members and stakeholders" },
    { name: "Problem Solving", category: softCategory, description: "Ability to identify, analyze, and solve complex problems" },
    { name: "Teamwork", category: softCategory, description: "Ability to work effectively within a team environment" },
    { name: "Time Management", category: softCategory, description: "Ability to prioritize tasks and manage time effectively" }
  ];
  
  // Role-specific skills
  let roleSpecificSkills: Array<{ name: string; category: string; description?: string }> = [];
  
  // Software Development Roles
  if (roleTitleLower.includes("frontend") || roleTitleLower.includes("front end") || roleTitleLower.includes("front-end")) {
    roleSpecificSkills = [
      { name: "HTML/CSS", category: technicalCategory, description: "Proficiency in creating structured, responsive web layouts" },
      { name: "JavaScript", category: technicalCategory, description: "Strong knowledge of JavaScript language fundamentals and modern ES6+ features" },
      { name: "React", category: toolsCategory, description: "Experience building applications using React component architecture" },
      { name: "UI/UX Principles", category: domainCategory, description: "Understanding of user interface design principles and usability" },
      { name: "Responsive Design", category: technicalCategory, description: "Creating interfaces that work well across different screen sizes and devices" },
      { name: "CSS Frameworks", category: toolsCategory, description: "Experience with Bootstrap, Tailwind CSS, or other CSS frameworks" },
      { name: "Front-End Performance", category: technicalCategory, description: "Optimizing website speed and performance" },
      { name: "Browser DevTools", category: toolsCategory, description: "Proficiency using browser developer tools for debugging" },
      { name: "Web Accessibility", category: technicalCategory, description: "Creating accessible web applications (WCAG compliance)" },
      { name: "Version Control (Git)", category: toolsCategory, description: "Using Git for source control and collaboration" }
    ];
  }
  else if (roleTitleLower.includes("backend") || roleTitleLower.includes("back end") || roleTitleLower.includes("back-end")) {
    roleSpecificSkills = [
      { name: "Server-side Programming", category: technicalCategory, description: "Proficiency in languages like Node.js, Python, Java, etc." },
      { name: "Database Design", category: technicalCategory, description: "Designing efficient database schemas and relationships" },
      { name: "SQL", category: technicalCategory, description: "Writing efficient database queries and managing database operations" },
      { name: "API Development", category: technicalCategory, description: "Building RESTful or GraphQL APIs following best practices" },
      { name: "Authentication/Authorization", category: technicalCategory, description: "Implementing secure user authentication and authorization systems" },
      { name: "Server Management", category: toolsCategory, description: "Configuring and maintaining server environments" },
      { name: "Caching Strategies", category: technicalCategory, description: "Implementing efficient caching to improve performance" },
      { name: "Security Best Practices", category: technicalCategory, description: "Protecting against common vulnerabilities (OWASP)" },
      { name: "Microservices Architecture", category: domainCategory, description: "Understanding distributed system design principles" },
      { name: "CI/CD Pipelines", category: toolsCategory, description: "Setting up automated testing and deployment workflows" }
    ];
  }
  else if (roleTitleLower.includes("fullstack") || roleTitleLower.includes("full stack") || roleTitleLower.includes("full-stack")) {
    roleSpecificSkills = [
      { name: "Frontend Development", category: technicalCategory, description: "Building responsive user interfaces with HTML, CSS, and JavaScript" },
      { name: "Backend Development", category: technicalCategory, description: "Developing server-side applications and APIs" },
      { name: "Database Management", category: technicalCategory, description: "Working with both SQL and NoSQL databases" },
      { name: "API Integration", category: technicalCategory, description: "Connecting systems through API development and consumption" },
      { name: "Deployment Strategies", category: toolsCategory, description: "Managing application deployment across different environments" },
      { name: "Testing Methodologies", category: technicalCategory, description: "Implementing unit, integration, and end-to-end tests" },
      { name: "DevOps Practices", category: toolsCategory, description: "Understanding CI/CD and infrastructure automation" },
      { name: "System Architecture", category: domainCategory, description: "Designing scalable application architectures" },
      { name: "Performance Optimization", category: technicalCategory, description: "Optimizing applications for speed and efficiency" },
      { name: "Security Implementation", category: technicalCategory, description: "Securing applications against common vulnerabilities" }
    ];
  }
  else if (roleTitleLower.includes("devops")) {
    roleSpecificSkills = [
      { name: "Infrastructure as Code", category: technicalCategory, description: "Using tools like Terraform or CloudFormation to manage infrastructure" },
      { name: "CI/CD Pipeline Management", category: toolsCategory, description: "Setting up and maintaining continuous integration/deployment pipelines" },
      { name: "Monitoring & Observability", category: toolsCategory, description: "Implementing systems for monitoring application health and performance" },
      { name: "Container Orchestration", category: toolsCategory, description: "Managing containerized environments with Kubernetes or similar tools" },
      { name: "Cloud Services", category: toolsCategory, description: "Working with AWS, Azure, GCP, or other cloud platforms" },
      { name: "Linux Administration", category: technicalCategory, description: "Managing and troubleshooting Linux-based systems" },
      { name: "Network Configuration", category: technicalCategory, description: "Setting up and managing network infrastructure" },
      { name: "Security Implementation", category: technicalCategory, description: "Implementing security best practices in infrastructure" },
      { name: "Scripting & Automation", category: technicalCategory, description: "Creating automation scripts for routine tasks" },
      { name: "Incident Response", category: domainCategory, description: "Responding to and resolving production incidents" }
    ];
  }
  else if (roleTitleLower.includes("data scientist") || roleTitleLower.includes("data science")) {
    roleSpecificSkills = [
      { name: "Statistical Analysis", category: technicalCategory, description: "Applying statistical methods to analyze data" },
      { name: "Machine Learning", category: technicalCategory, description: "Developing and implementing machine learning models" },
      { name: "Python Programming", category: toolsCategory, description: "Proficiency in Python for data analysis and modeling" },
      { name: "Data Visualization", category: technicalCategory, description: "Creating informative visual representations of data" },
      { name: "Feature Engineering", category: technicalCategory, description: "Selecting and transforming variables for model development" },
      { name: "SQL", category: technicalCategory, description: "Querying databases to extract and manipulate data" },
      { name: "Big Data Technologies", category: toolsCategory, description: "Working with large datasets using tools like Spark or Hadoop" },
      { name: "Experimental Design", category: domainCategory, description: "Designing experiments to test hypotheses and validate results" },
      { name: "Model Deployment", category: technicalCategory, description: "Moving models from development to production environments" },
      { name: "Research Methodology", category: domainCategory, description: "Applying scientific research principles to data problems" }
    ];
  }
  else if (roleTitleLower.includes("data engineer")) {
    roleSpecificSkills = [
      { name: "Data Pipeline Development", category: technicalCategory, description: "Building robust data extraction and processing pipelines" },
      { name: "Database Systems", category: toolsCategory, description: "Working with SQL and NoSQL databases at scale" },
      { name: "ETL Processes", category: technicalCategory, description: "Implementing Extract, Transform, Load workflows" },
      { name: "Big Data Technologies", category: toolsCategory, description: "Using Hadoop, Spark, or similar technologies for large-scale data processing" },
      { name: "Data Modeling", category: technicalCategory, description: "Designing efficient data schemas and models" },
      { name: "Data Warehousing", category: toolsCategory, description: "Implementing and maintaining data warehouse solutions" },
      { name: "Scripting Languages", category: technicalCategory, description: "Proficiency in Python, Scala, or other languages for data processing" },
      { name: "Cloud Data Services", category: toolsCategory, description: "Working with cloud-based data services (AWS, Azure, GCP)" },
      { name: "Data Security", category: technicalCategory, description: "Implementing data protection and privacy measures" },
      { name: "Data Quality Management", category: domainCategory, description: "Ensuring consistency and quality of data" }
    ];
  }
  // Banking & Financial Services Roles
  else if (roleTitleLower.includes("banking analyst") || roleTitleLower.includes("financial analyst")) {
    roleSpecificSkills = [
      { name: "Financial Analysis", category: technicalCategory, description: "Analyzing financial statements and market trends" },
      { name: "Risk Assessment", category: domainCategory, description: "Evaluating financial risks and developing mitigation strategies" },
      { name: "Banking Regulations", category: domainCategory, description: "Understanding of banking laws and regulatory requirements" },
      { name: "Financial Modeling", category: technicalCategory, description: "Creating financial models to forecast performance" },
      { name: "Credit Analysis", category: technicalCategory, description: "Assessing creditworthiness of individuals or organizations" },
      { name: "Banking Software", category: toolsCategory, description: "Proficiency with financial analysis and banking software" },
      { name: "Market Research", category: domainCategory, description: "Analyzing market trends and competitive landscape" },
      { name: "Valuation Methods", category: technicalCategory, description: "Applying various methods to determine asset values" },
      { name: "Financial Reporting", category: technicalCategory, description: "Preparing and analyzing financial reports" },
      { name: "Excel Advanced Functions", category: toolsCategory, description: "Advanced spreadsheet analysis and financial functions" }
    ];
  }
  else if (roleTitleLower.includes("product manager")) {
    roleSpecificSkills = [
      { name: "Product Roadmapping", category: technicalCategory, description: "Developing and maintaining product roadmaps" },
      { name: "User Story Creation", category: technicalCategory, description: "Writing clear, valuable user stories" },
      { name: "Market Research", category: domainCategory, description: "Analyzing market trends and competitive landscape" },
      { name: "Product Metrics Analysis", category: technicalCategory, description: "Defining and tracking key product performance metrics" },
      { name: "Stakeholder Management", category: managementCategory, description: "Managing relationships with internal and external stakeholders" },
      { name: "Agile Methodologies", category: toolsCategory, description: "Working in Agile environments (Scrum, Kanban)" },
      { name: "Product Launch Planning", category: managementCategory, description: "Planning and executing successful product launches" },
      { name: "Feature Prioritization", category: technicalCategory, description: "Prioritizing product features based on value and effort" },
      { name: "UX/UI Knowledge", category: domainCategory, description: "Understanding user experience principles and best practices" },
      { name: "Customer Feedback Analysis", category: technicalCategory, description: "Gathering and analyzing customer feedback" }
    ];
  }
  else if (roleTitleLower.includes("scrum master")) {
    roleSpecificSkills = [
      { name: "Agile Facilitation", category: managementCategory, description: "Facilitating Scrum events effectively" },
      { name: "Impediment Removal", category: managementCategory, description: "Identifying and removing obstacles for the team" },
      { name: "Servant Leadership", category: softCategory, description: "Coaching teams with a servant-leader mentality" },
      { name: "Scrum Framework", category: domainCategory, description: "Deep understanding of Scrum roles, artifacts, and events" },
      { name: "Conflict Resolution", category: softCategory, description: "Mediating and resolving team conflicts" },
      { name: "Team Building", category: managementCategory, description: "Creating cohesive, high-performing teams" },
      { name: "Agile Metrics", category: technicalCategory, description: "Tracking and interpreting agile performance metrics" },
      { name: "Continuous Improvement", category: managementCategory, description: "Implementing process improvements based on retrospectives" },
      { name: "Sprint Planning", category: managementCategory, description: "Facilitating effective sprint planning sessions" },
      { name: "Agile Tools", category: toolsCategory, description: "Using Jira, Trello, or other agile project management tools" }
    ];
  }
  else if (roleTitleLower.includes("agile coach")) {
    roleSpecificSkills = [
      { name: "Agile Transformation", category: managementCategory, description: "Guiding organizational agile transformations" },
      { name: "Multiple Agile Frameworks", category: domainCategory, description: "Knowledge of Scrum, Kanban, SAFe, LeSS, etc." },
      { name: "Advanced Facilitation", category: managementCategory, description: "Facilitating complex agile events and workshops" },
      { name: "Change Management", category: managementCategory, description: "Managing organizational change processes" },
      { name: "Leadership Coaching", category: managementCategory, description: "Coaching executives and managers on agile leadership" },
      { name: "Team Performance Coaching", category: managementCategory, description: "Improving team dynamics and performance" },
      { name: "Organizational Design", category: domainCategory, description: "Advising on organizational structures that support agility" },
      { name: "Lean Principles", category: domainCategory, description: "Applying lean thinking to eliminate waste" },
      { name: "Metrics & Measurements", category: technicalCategory, description: "Establishing appropriate metrics for agile maturity" },
      { name: "Training Design", category: managementCategory, description: "Creating and delivering agile training programs" }
    ];
  }
  else if (roleTitleLower.includes("product owner")) {
    roleSpecificSkills = [
      { name: "Product Backlog Management", category: managementCategory, description: "Creating and refining the product backlog" },
      { name: "Value Maximization", category: managementCategory, description: "Ensuring the product delivers maximum business value" },
      { name: "User Story Writing", category: technicalCategory, description: "Creating clear, valuable user stories" },
      { name: "Business Case Development", category: domainCategory, description: "Creating business cases for product initiatives" },
      { name: "Feature Prioritization", category: managementCategory, description: "Prioritizing features based on value and effort" },
      { name: "Stakeholder Communication", category: softCategory, description: "Effectively communicating with diverse stakeholders" },
      { name: "Product Vision", category: domainCategory, description: "Establishing and communicating product vision" },
      { name: "Acceptance Criteria Definition", category: technicalCategory, description: "Defining clear acceptance criteria for features" },
      { name: "ROI Analysis", category: domainCategory, description: "Analyzing return on investment for product features" },
      { name: "Sprint Review Facilitation", category: managementCategory, description: "Leading effective sprint reviews" }
    ];
  }
  // Software Development (Specific Technologies)
  else if (roleTitleLower.includes("java")) {
    roleSpecificSkills = [
      { name: "Java Programming", category: technicalCategory, description: "Strong proficiency in Java language and JVM concepts" },
      { name: "Spring Framework", category: toolsCategory, description: "Experience with Spring Boot, Spring MVC, or other Spring projects" },
      { name: "OOP Principles", category: technicalCategory, description: "Solid understanding of object-oriented programming concepts" },
      { name: "JUnit Testing", category: toolsCategory, description: "Writing effective unit and integration tests with JUnit" },
      { name: "Hibernate/JPA", category: toolsCategory, description: "Working with Java Persistence API and ORM frameworks" },
      { name: "Concurrency", category: technicalCategory, description: "Understanding thread management and concurrent programming" },
      { name: "Design Patterns", category: technicalCategory, description: "Implementing common design patterns in Java applications" },
      { name: "Build Tools", category: toolsCategory, description: "Using Maven or Gradle for dependency management and builds" },
      { name: "Microservices in Java", category: technicalCategory, description: "Building microservices-based applications with Java" },
      { name: "Java Performance Tuning", category: technicalCategory, description: "Optimizing Java applications for performance" }
    ];
  }
  else if (roleTitleLower.includes("python")) {
    roleSpecificSkills = [
      { name: "Python Programming", category: technicalCategory, description: "Strong proficiency in Python language and ecosystem" },
      { name: "Django/Flask", category: toolsCategory, description: "Building web applications with Python frameworks" },
      { name: "Data Analysis (Pandas)", category: toolsCategory, description: "Analyzing and manipulating data with Python libraries" },
      { name: "Python Testing", category: technicalCategory, description: "Writing tests with pytest or unittest" },
      { name: "API Development", category: technicalCategory, description: "Creating RESTful or GraphQL APIs with Python" },
      { name: "Python OOP", category: technicalCategory, description: "Implementing object-oriented programming in Python" },
      { name: "Asyncio", category: technicalCategory, description: "Writing asynchronous code with Python's asyncio" },
      { name: "Package Management", category: toolsCategory, description: "Managing dependencies with pip, conda, or Poetry" },
      { name: "Web Scraping", category: technicalCategory, description: "Extracting data from websites with Beautiful Soup or Scrapy" },
      { name: "Automation Scripting", category: technicalCategory, description: "Creating automation scripts with Python" }
    ];
  }
  else if (roleTitleLower.includes("animation")) {
    roleSpecificSkills = [
      { name: "3D Modeling", category: technicalCategory, description: "Creating three-dimensional models for animation" },
      { name: "Animation Principles", category: domainCategory, description: "Understanding and applying the fundamental principles of animation" },
      { name: "Character Rigging", category: technicalCategory, description: "Setting up character skeletons and controls for animation" },
      { name: "Texturing", category: technicalCategory, description: "Creating and applying textures to 3D models" },
      { name: "Storyboarding", category: technicalCategory, description: "Planning out animation sequences visually" },
      { name: "Animation Software", category: toolsCategory, description: "Proficiency with tools like Maya, Blender, After Effects" },
      { name: "Rendering Techniques", category: technicalCategory, description: "Understanding various rendering methods and settings" },
      { name: "Motion Capture", category: technicalCategory, description: "Working with motion capture data for realistic movement" },
      { name: "Compositing", category: technicalCategory, description: "Combining various visual elements into final scenes" },
      { name: "Visual Storytelling", category: domainCategory, description: "Conveying narrative through visual animation techniques" }
    ];
  }
  else if (roleTitleLower.includes("cybersecurity") || roleTitleLower.includes("security engineer")) {
    roleSpecificSkills = [
      { name: "Threat Modeling", category: technicalCategory, description: "Identifying potential security threats and vulnerabilities" },
      { name: "Security Testing", category: technicalCategory, description: "Performing penetration testing and security assessments" },
      { name: "Network Security", category: technicalCategory, description: "Securing network infrastructure and traffic" },
      { name: "Identity & Access Management", category: technicalCategory, description: "Implementing proper authentication and authorization controls" },
      { name: "Incident Response", category: technicalCategory, description: "Responding to and analyzing security incidents" },
      { name: "Security Tools", category: toolsCategory, description: "Using tools for vulnerability scanning, packet analysis, etc." },
      { name: "Cryptography", category: technicalCategory, description: "Implementing and managing encryption solutions" },
      { name: "Security Compliance", category: domainCategory, description: "Understanding security standards and regulations (GDPR, SOC2, etc.)" },
      { name: "Secure Coding Practices", category: technicalCategory, description: "Writing code that prevents common security vulnerabilities" },
      { name: "Cloud Security", category: technicalCategory, description: "Securing applications and infrastructure in cloud environments" }
    ];
  }
  // Add a default case for any other roles
  else {
    roleSpecificSkills = [
      { name: "Industry Knowledge", category: domainCategory, description: `Understanding of ${industry} industry standards and best practices` },
      { name: "Technical Expertise", category: technicalCategory, description: `Technical proficiency relevant to ${roleTitle} role` },
      { name: "Professional Development", category: softCategory, description: "Continuous learning and skill development" },
      { name: "Project Management", category: managementCategory, description: "Planning, executing, and closing projects effectively" },
      { name: "Analytical Thinking", category: softCategory, description: "Ability to analyze complex problems and develop solutions" },
      { name: "Industry Tools", category: toolsCategory, description: `Proficiency with tools commonly used in ${roleTitle} role` }
    ];
  }
  
  // Add some common soft skills to all roles
  return [...roleSpecificSkills, ...commonSoftSkills];
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
        // Convert targetRoleId from string to number if present
        const goalData = {
          ...req.body,
          targetRoleId: req.body.targetRoleId ? parseInt(req.body.targetRoleId) : undefined
        };
        
        const goalDataResult = insertCareerGoalSchema.safeParse(goalData);
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

        const updateData = {
          ...req.body,
          // Convert string targetRoleId to number if it exists
          targetRoleId: req.body.targetRoleId ? parseInt(req.body.targetRoleId) : undefined
        };
        const updatedGoal = await storage.updateCareerGoal(goalId, updateData);
        
        res.json(updatedGoal);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Set a target role for a user's career goal
  app.post(
    "/api/users/career-goals/set-target-role",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // For development, use a mock user ID
        const userId = req.user ? (req.user as any).id : 1; // Use actual user ID if logged in
        
        const { targetRoleId } = req.body;
        
        if (!targetRoleId) {
          return res.status(400).json({ message: "Target role ID is required" });
        }
        
        // Convert to number if it's a string
        const targetRoleIdNum = typeof targetRoleId === 'string' ? parseInt(targetRoleId) : targetRoleId;
        
        // Get the target role to ensure it exists
        const targetRole = await storage.getInterviewRole(targetRoleIdNum);
        
        if (!targetRole) {
          return res.status(404).json({ message: "Target role not found" });
        }
        
        // Get existing goals for the user
        const existingGoals = await storage.getCareerGoalsByUserId(userId);
        let updatedGoal;
        
        // If user already has a goal, update it
        if (existingGoals && existingGoals.length > 0) {
          // Sort by ID (highest/newest first)
          const sortedGoals = [...existingGoals].sort((a, b) => b.id - a.id);
          const mostRecentGoal = sortedGoals[0];
          
          // Update the goal with the new target role
          updatedGoal = await storage.updateCareerGoal(mostRecentGoal.id, {
            targetRoleId: targetRoleIdNum,
            title: targetRole.title,
            description: `Career goal created from role comparison: transition to ${targetRole.title}`
          });
          
          // Create activity entry for updating a target role
          await storage.createUserActivity({
            userId,
            activityType: "update_career_goal",
            description: `Updated target role to: ${targetRole.title}`,
            metadata: { goalId: updatedGoal.id, targetRoleId: targetRoleIdNum }
          });
        } else {
          // Create a new goal if none exists
          updatedGoal = await storage.createCareerGoal({
            userId,
            targetRoleId: targetRoleIdNum,
            title: targetRole.title,
            description: `Career goal created from role comparison: transition to ${targetRole.title}`,
            timelineMonths: 12, // Default timeline
            readiness: 0 // Default readiness
          });
          
          // Create activity entry for setting a career goal
          await storage.createUserActivity({
            userId,
            activityType: "set_career_goal",
            description: `Set career goal: ${updatedGoal.title}`,
            metadata: { goalId: updatedGoal.id, targetRoleId: targetRoleIdNum }
          });
        }
        
        // Return the updated goal with ID
        res.json({ 
          goalId: updatedGoal.id,
          targetRoleId: targetRoleIdNum,
          title: targetRole.title
        });
      } catch (error) {
        console.error("Error setting target role:", error);
        next(error);
      }
    }
  );
  
  // Select a career goal as the current one
  app.post(
    "/api/users/career-goals/:id/select",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const goalId = parseInt(req.params.id);
        const userId = req.user ? (req.user as any).id : 1; // Use actual user ID if logged in
        
        // Check if the goal exists
        const goal = await storage.getCareerGoal(goalId);
        
        if (!goal) {
          return res.status(404).json({ message: "Career goal not found" });
        }
        
        // Make sure the goal belongs to the user
        if (goal.userId !== userId) {
          return res.status(403).json({ message: "You don't have permission to select this goal" });
        }
        
        // Simply return the goal data as it's already selected
        // In a multi-goal system, we might mark this as the "active" goal
        res.json(goal);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Get current user's career goal
  app.get(
    "/api/users/career-goals/current",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // For development, use a mock user ID
        const userId = req.user ? (req.user as any).id : 1; // Use actual user ID if logged in
        
        // Get the latest goal for the user directly from the database
        const latestGoal = await storage.getLatestCareerGoalByUserId(userId);
        
        // Return the goal if it exists
        if (latestGoal) {
          console.log("[DEBUG] Current career goal API - Latest career goal:", 
            { id: latestGoal.id, title: latestGoal.title }
          );
          return res.json(latestGoal);
        }
        
        // No goals found
        return res.status(404).json({ message: "No career goal found" });
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Create or update user's career goal
  app.post(
    "/api/users/career-goals",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // For development, use a mock user ID
        const userId = req.user ? (req.user as any).id : 1; // Use actual user ID if logged in
        
        // Get existing goals
        const existingGoals = await storage.getCareerGoalsByUserId(userId);
        
        // Prepare data with the user ID
        const goalData = {
          ...req.body,
          userId,
          // Convert string targetRoleId to number if it exists
          targetRoleId: req.body.targetRoleId ? parseInt(req.body.targetRoleId) : undefined,
          readiness: req.body.readiness || 0 // Default readiness to 0 if not provided
        };
        
        // Validate the goal data
        const goalDataResult = insertCareerGoalSchema.safeParse(goalData);
        if (!goalDataResult.success) {
          return res.status(400).json({
            message: "Invalid career goal data",
            errors: goalDataResult.error.errors,
          });
        }
        
        let response;
        
        // If user already has a goal, update the most recent one
        if (existingGoals && existingGoals.length > 0) {
          // Sort by ID (highest/newest first)
          const sortedGoals = [...existingGoals].sort((a, b) => b.id - a.id);
          console.log("[DEBUG] Career goals POST - Sorted career goals by ID (descending):", 
            sortedGoals.map(goal => ({ id: goal.id, title: goal.title }))
          );
          
          const mostRecentGoal = sortedGoals[0];
          response = await storage.updateCareerGoal(mostRecentGoal.id, goalDataResult.data);
          
          // Create activity entry for updating a career goal
          await storage.createUserActivity({
            userId,
            activityType: "update_career_goal",
            description: `Updated career goal: ${response.title}`,
            metadata: { goalId: response.id }
          });
          
          return res.json(response);
        }
        
        // Otherwise, create a new goal
        response = await storage.createCareerGoal(goalDataResult.data);
        
        // Create activity entry for setting a career goal
        await storage.createUserActivity({
          userId,
          activityType: "set_career_goal",
          description: `Set career goal: ${response.title}`,
          metadata: { goalId: response.id }
        });
        
        res.status(201).json(response);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Update user's career goal by ID
  app.patch(
    "/api/users/career-goals/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const goalId = parseInt(req.params.id);
        const userId = req.user ? (req.user as any).id : 1; // Use actual user ID if logged in
        
        const goal = await storage.getCareerGoal(goalId);
        
        if (!goal) {
          return res.status(404).json({ message: "Career goal not found" });
        }
        
        // Make sure the goal belongs to the user
        if (goal.userId !== userId) {
          return res.status(403).json({ message: "You don't have permission to update this goal" });
        }
        
        // Update the goal
        const updateData = {
          ...req.body,
          // Convert string targetRoleId to number if it exists
          targetRoleId: req.body.targetRoleId ? parseInt(req.body.targetRoleId) : undefined
        };
        const updatedGoal = await storage.updateCareerGoal(goalId, updateData);
        
        // Create activity entry for updating a career goal
        await storage.createUserActivity({
          userId,
          activityType: "update_career_goal",
          description: `Updated career goal: ${updatedGoal.title}`,
          metadata: { goalId: updatedGoal.id }
        });
        
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

  // Helper function to generate role-specific skills based on role title and industry
  function generateRoleSpecificSkills(roleTitle: string, industry: string): Array<{
    name: string;
    category: string;
    description?: string;
  }> {
    const roleTitleLower = roleTitle.toLowerCase();
    const industryLower = industry?.toLowerCase() || "";
    
    // Default categories
    const technicalCategory = "Technical Skills";
    const softCategory = "Soft Skills";
    const domainCategory = "Domain Knowledge";
    const toolsCategory = "Tools & Technologies";
    const managementCategory = "Management Skills";
    
    // Common soft skills that apply to most roles
    const commonSoftSkills = [
      { name: "Communication", category: softCategory, description: "Ability to communicate clearly and effectively with team members and stakeholders" },
      { name: "Problem Solving", category: softCategory, description: "Ability to identify, analyze, and solve complex problems" },
      { name: "Teamwork", category: softCategory, description: "Ability to work effectively within a team environment" },
      { name: "Time Management", category: softCategory, description: "Ability to prioritize tasks and manage time effectively" }
    ];
    
    // Role-specific skills
    let roleSpecificSkills: Array<{ name: string; category: string; description?: string }> = [];
    
    // Software Development Roles
    if (roleTitleLower.includes("frontend") || roleTitleLower.includes("front end") || roleTitleLower.includes("front-end")) {
      roleSpecificSkills = [
        { name: "HTML/CSS", category: technicalCategory, description: "Proficiency in creating structured, responsive web layouts" },
        { name: "JavaScript", category: technicalCategory, description: "Strong knowledge of JavaScript language fundamentals and modern ES6+ features" },
        { name: "React", category: toolsCategory, description: "Experience building applications using React component architecture" },
        { name: "UI/UX Principles", category: domainCategory, description: "Understanding of user interface design principles and usability" },
        { name: "Responsive Design", category: technicalCategory, description: "Creating interfaces that work well across different screen sizes and devices" },
        { name: "CSS Frameworks", category: toolsCategory, description: "Experience with Bootstrap, Tailwind CSS, or other CSS frameworks" },
        { name: "Front-End Performance", category: technicalCategory, description: "Optimizing website speed and performance" },
        { name: "Browser DevTools", category: toolsCategory, description: "Proficiency using browser developer tools for debugging" },
        { name: "Web Accessibility", category: technicalCategory, description: "Creating accessible web applications (WCAG compliance)" },
        { name: "Version Control (Git)", category: toolsCategory, description: "Using Git for source control and collaboration" }
      ];
    }
    else if (roleTitleLower.includes("backend") || roleTitleLower.includes("back end") || roleTitleLower.includes("back-end")) {
      roleSpecificSkills = [
        { name: "Server-side Programming", category: technicalCategory, description: "Proficiency in languages like Node.js, Python, Java, etc." },
        { name: "Database Design", category: technicalCategory, description: "Designing efficient database schemas and relationships" },
        { name: "SQL", category: technicalCategory, description: "Writing efficient database queries and managing database operations" },
        { name: "API Development", category: technicalCategory, description: "Building RESTful or GraphQL APIs following best practices" },
        { name: "Authentication/Authorization", category: technicalCategory, description: "Implementing secure user authentication and authorization systems" },
        { name: "Server Management", category: toolsCategory, description: "Configuring and maintaining server environments" },
        { name: "Caching Strategies", category: technicalCategory, description: "Implementing efficient caching to improve performance" },
        { name: "Security Best Practices", category: technicalCategory, description: "Protecting against common vulnerabilities (OWASP)" },
        { name: "Microservices Architecture", category: domainCategory, description: "Understanding distributed system design principles" },
        { name: "CI/CD Pipelines", category: toolsCategory, description: "Setting up automated testing and deployment workflows" }
      ];
    }
    else if (roleTitleLower.includes("fullstack") || roleTitleLower.includes("full stack") || roleTitleLower.includes("full-stack")) {
      roleSpecificSkills = [
        { name: "Frontend Development", category: technicalCategory, description: "Building responsive user interfaces with HTML, CSS, and JavaScript" },
        { name: "Backend Development", category: technicalCategory, description: "Developing server-side applications and APIs" },
        { name: "Database Management", category: technicalCategory, description: "Working with both SQL and NoSQL databases" },
        { name: "API Integration", category: technicalCategory, description: "Connecting systems through API development and consumption" },
        { name: "Deployment Strategies", category: toolsCategory, description: "Managing application deployment across different environments" },
        { name: "Testing Methodologies", category: technicalCategory, description: "Implementing unit, integration, and end-to-end tests" },
        { name: "DevOps Practices", category: toolsCategory, description: "Understanding CI/CD and infrastructure automation" },
        { name: "System Architecture", category: domainCategory, description: "Designing scalable application architectures" },
        { name: "Performance Optimization", category: technicalCategory, description: "Optimizing applications for speed and efficiency" },
        { name: "Security Implementation", category: technicalCategory, description: "Securing applications against common vulnerabilities" }
      ];
    }
    else if (roleTitleLower.includes("devops")) {
      roleSpecificSkills = [
        { name: "Infrastructure as Code", category: technicalCategory, description: "Using tools like Terraform or CloudFormation to manage infrastructure" },
        { name: "CI/CD Pipeline Management", category: toolsCategory, description: "Setting up and maintaining continuous integration/deployment pipelines" },
        { name: "Monitoring & Observability", category: toolsCategory, description: "Implementing systems for monitoring application health and performance" },
        { name: "Container Orchestration", category: toolsCategory, description: "Managing containerized environments with Kubernetes or similar tools" },
        { name: "Cloud Services", category: toolsCategory, description: "Working with AWS, Azure, GCP, or other cloud platforms" },
        { name: "Linux Administration", category: technicalCategory, description: "Managing and troubleshooting Linux-based systems" },
        { name: "Network Configuration", category: technicalCategory, description: "Setting up and managing network infrastructure" },
        { name: "Security Implementation", category: technicalCategory, description: "Implementing security best practices in infrastructure" },
        { name: "Scripting & Automation", category: technicalCategory, description: "Creating automation scripts for routine tasks" },
        { name: "Incident Response", category: domainCategory, description: "Responding to and resolving production incidents" }
      ];
    }
    else if (roleTitleLower.includes("data scientist") || roleTitleLower.includes("data science")) {
      roleSpecificSkills = [
        { name: "Statistical Analysis", category: technicalCategory, description: "Applying statistical methods to analyze data" },
        { name: "Machine Learning", category: technicalCategory, description: "Developing and implementing machine learning models" },
        { name: "Python Programming", category: toolsCategory, description: "Proficiency in Python for data analysis and modeling" },
        { name: "Data Visualization", category: technicalCategory, description: "Creating informative visual representations of data" },
        { name: "Feature Engineering", category: technicalCategory, description: "Selecting and transforming variables for model development" },
        { name: "SQL", category: technicalCategory, description: "Querying databases to extract and manipulate data" },
        { name: "Big Data Technologies", category: toolsCategory, description: "Working with large datasets using tools like Spark or Hadoop" },
        { name: "Experimental Design", category: domainCategory, description: "Designing experiments to test hypotheses and validate results" },
        { name: "Model Deployment", category: technicalCategory, description: "Moving models from development to production environments" },
        { name: "Research Methodology", category: domainCategory, description: "Applying scientific research principles to data problems" }
      ];
    }
    else if (roleTitleLower.includes("data engineer")) {
      roleSpecificSkills = [
        { name: "Data Pipeline Development", category: technicalCategory, description: "Building robust data extraction and processing pipelines" },
        { name: "Database Systems", category: toolsCategory, description: "Working with SQL and NoSQL databases at scale" },
        { name: "ETL Processes", category: technicalCategory, description: "Implementing Extract, Transform, Load workflows" },
        { name: "Big Data Technologies", category: toolsCategory, description: "Using Hadoop, Spark, or similar technologies for large-scale data processing" },
        { name: "Data Modeling", category: technicalCategory, description: "Designing efficient data schemas and models" },
        { name: "Data Warehousing", category: toolsCategory, description: "Implementing and maintaining data warehouse solutions" },
        { name: "Scripting Languages", category: technicalCategory, description: "Proficiency in Python, Scala, or other languages for data processing" },
        { name: "Cloud Data Services", category: toolsCategory, description: "Working with cloud-based data services (AWS, Azure, GCP)" },
        { name: "Data Security", category: technicalCategory, description: "Implementing data protection and privacy measures" },
        { name: "Data Quality Management", category: domainCategory, description: "Ensuring consistency and quality of data" }
      ];
    }
    // Banking & Financial Services Roles
    else if (roleTitleLower.includes("banking analyst") || roleTitleLower.includes("financial analyst")) {
      roleSpecificSkills = [
        { name: "Financial Analysis", category: technicalCategory, description: "Analyzing financial statements and market trends" },
        { name: "Risk Assessment", category: domainCategory, description: "Evaluating financial risks and developing mitigation strategies" },
        { name: "Banking Regulations", category: domainCategory, description: "Understanding of banking laws and regulatory requirements" },
        { name: "Financial Modeling", category: technicalCategory, description: "Creating financial models to forecast performance" },
        { name: "Credit Analysis", category: technicalCategory, description: "Assessing creditworthiness of individuals or organizations" },
        { name: "Banking Software", category: toolsCategory, description: "Proficiency with financial analysis and banking software" },
        { name: "Market Research", category: domainCategory, description: "Analyzing market trends and competitive landscape" },
        { name: "Valuation Methods", category: technicalCategory, description: "Applying various methods to determine asset values" },
        { name: "Financial Reporting", category: technicalCategory, description: "Preparing and analyzing financial reports" },
        { name: "Excel Advanced Functions", category: toolsCategory, description: "Advanced spreadsheet analysis and financial functions" }
      ];
    }
    else if (roleTitleLower.includes("product manager")) {
      roleSpecificSkills = [
        { name: "Product Roadmapping", category: technicalCategory, description: "Developing and maintaining product roadmaps" },
        { name: "User Story Creation", category: technicalCategory, description: "Writing clear, valuable user stories" },
        { name: "Market Research", category: domainCategory, description: "Analyzing market trends and competitive landscape" },
        { name: "Product Metrics Analysis", category: technicalCategory, description: "Defining and tracking key product performance metrics" },
        { name: "Stakeholder Management", category: managementCategory, description: "Managing relationships with internal and external stakeholders" },
        { name: "Agile Methodologies", category: toolsCategory, description: "Working in Agile environments (Scrum, Kanban)" },
        { name: "Product Launch Planning", category: managementCategory, description: "Planning and executing successful product launches" },
        { name: "Feature Prioritization", category: technicalCategory, description: "Prioritizing product features based on value and effort" },
        { name: "UX/UI Knowledge", category: domainCategory, description: "Understanding user experience principles and best practices" },
        { name: "Customer Feedback Analysis", category: technicalCategory, description: "Gathering and analyzing customer feedback" }
      ];
    }
    else if (roleTitleLower.includes("scrum master")) {
      roleSpecificSkills = [
        { name: "Agile Facilitation", category: managementCategory, description: "Facilitating Scrum events effectively" },
        { name: "Impediment Removal", category: managementCategory, description: "Identifying and removing obstacles for the team" },
        { name: "Servant Leadership", category: softCategory, description: "Coaching teams with a servant-leader mentality" },
        { name: "Scrum Framework", category: domainCategory, description: "Deep understanding of Scrum roles, artifacts, and events" },
        { name: "Conflict Resolution", category: softCategory, description: "Mediating and resolving team conflicts" },
        { name: "Team Building", category: managementCategory, description: "Creating cohesive, high-performing teams" },
        { name: "Agile Metrics", category: technicalCategory, description: "Tracking and interpreting agile performance metrics" },
        { name: "Continuous Improvement", category: managementCategory, description: "Implementing process improvements based on retrospectives" },
        { name: "Sprint Planning", category: managementCategory, description: "Facilitating effective sprint planning sessions" },
        { name: "Agile Tools", category: toolsCategory, description: "Using Jira, Trello, or other agile project management tools" }
      ];
    }
    else if (roleTitleLower.includes("agile coach")) {
      roleSpecificSkills = [
        { name: "Agile Transformation", category: managementCategory, description: "Guiding organizational agile transformations" },
        { name: "Multiple Agile Frameworks", category: domainCategory, description: "Knowledge of Scrum, Kanban, SAFe, LeSS, etc." },
        { name: "Advanced Facilitation", category: managementCategory, description: "Facilitating complex agile events and workshops" },
        { name: "Change Management", category: managementCategory, description: "Managing organizational change processes" },
        { name: "Leadership Coaching", category: managementCategory, description: "Coaching executives and managers on agile leadership" },
        { name: "Team Performance Coaching", category: managementCategory, description: "Improving team dynamics and performance" },
        { name: "Organizational Design", category: domainCategory, description: "Advising on organizational structures that support agility" },
        { name: "Lean Principles", category: domainCategory, description: "Applying lean thinking to eliminate waste" },
        { name: "Metrics & Measurements", category: technicalCategory, description: "Establishing appropriate metrics for agile maturity" },
        { name: "Training Design", category: managementCategory, description: "Creating and delivering agile training programs" }
      ];
    }
    else if (roleTitleLower.includes("product owner")) {
      roleSpecificSkills = [
        { name: "Product Backlog Management", category: managementCategory, description: "Creating and refining the product backlog" },
        { name: "Value Maximization", category: managementCategory, description: "Ensuring the product delivers maximum business value" },
        { name: "User Story Writing", category: technicalCategory, description: "Creating clear, valuable user stories" },
        { name: "Business Case Development", category: domainCategory, description: "Creating business cases for product initiatives" },
        { name: "Feature Prioritization", category: managementCategory, description: "Prioritizing features based on value and effort" },
        { name: "Stakeholder Communication", category: softCategory, description: "Effectively communicating with diverse stakeholders" },
        { name: "Product Vision", category: domainCategory, description: "Establishing and communicating product vision" },
        { name: "Acceptance Criteria Definition", category: technicalCategory, description: "Defining clear acceptance criteria for features" },
        { name: "ROI Analysis", category: domainCategory, description: "Analyzing return on investment for product features" },
        { name: "Sprint Review Facilitation", category: managementCategory, description: "Leading effective sprint reviews" }
      ];
    }
    // Software Development (Specific Technologies)
    else if (roleTitleLower.includes("java")) {
      roleSpecificSkills = [
        { name: "Java Programming", category: technicalCategory, description: "Strong proficiency in Java language and JVM concepts" },
        { name: "Spring Framework", category: toolsCategory, description: "Experience with Spring Boot, Spring MVC, or other Spring projects" },
        { name: "OOP Principles", category: technicalCategory, description: "Solid understanding of object-oriented programming concepts" },
        { name: "JUnit Testing", category: toolsCategory, description: "Writing effective unit and integration tests with JUnit" },
        { name: "Hibernate/JPA", category: toolsCategory, description: "Working with Java Persistence API and ORM frameworks" },
        { name: "Concurrency", category: technicalCategory, description: "Understanding thread management and concurrent programming" },
        { name: "Design Patterns", category: technicalCategory, description: "Implementing common design patterns in Java applications" },
        { name: "Build Tools", category: toolsCategory, description: "Using Maven or Gradle for dependency management and builds" },
        { name: "Microservices in Java", category: technicalCategory, description: "Building microservices-based applications with Java" },
        { name: "Java Performance Tuning", category: technicalCategory, description: "Optimizing Java applications for performance" }
      ];
    }
    else if (roleTitleLower.includes("python")) {
      roleSpecificSkills = [
        { name: "Python Programming", category: technicalCategory, description: "Strong proficiency in Python language and ecosystem" },
        { name: "Django/Flask", category: toolsCategory, description: "Building web applications with Python frameworks" },
        { name: "Data Analysis (Pandas)", category: toolsCategory, description: "Analyzing and manipulating data with Python libraries" },
        { name: "Python Testing", category: technicalCategory, description: "Writing tests with pytest or unittest" },
        { name: "API Development", category: technicalCategory, description: "Creating RESTful or GraphQL APIs with Python" },
        { name: "Python OOP", category: technicalCategory, description: "Implementing object-oriented programming in Python" },
        { name: "Asyncio", category: technicalCategory, description: "Writing asynchronous code with Python's asyncio" },
        { name: "Package Management", category: toolsCategory, description: "Managing dependencies with pip, conda, or Poetry" },
        { name: "Web Scraping", category: technicalCategory, description: "Extracting data from websites with Beautiful Soup or Scrapy" },
        { name: "Automation Scripting", category: technicalCategory, description: "Creating automation scripts with Python" }
      ];
    }
    else if (roleTitleLower.includes("animation")) {
      roleSpecificSkills = [
        { name: "3D Modeling", category: technicalCategory, description: "Creating three-dimensional models for animation" },
        { name: "Animation Principles", category: domainCategory, description: "Understanding and applying the fundamental principles of animation" },
        { name: "Character Rigging", category: technicalCategory, description: "Setting up character skeletons and controls for animation" },
        { name: "Texturing", category: technicalCategory, description: "Creating and applying textures to 3D models" },
        { name: "Storyboarding", category: technicalCategory, description: "Planning out animation sequences visually" },
        { name: "Animation Software", category: toolsCategory, description: "Proficiency with tools like Maya, Blender, After Effects" },
        { name: "Rendering Techniques", category: technicalCategory, description: "Understanding various rendering methods and settings" },
        { name: "Motion Capture", category: technicalCategory, description: "Working with motion capture data for realistic movement" },
        { name: "Compositing", category: technicalCategory, description: "Combining various visual elements into final scenes" },
        { name: "Visual Storytelling", category: domainCategory, description: "Conveying narrative through visual animation techniques" }
      ];
    }
    else if (roleTitleLower.includes("cybersecurity") || roleTitleLower.includes("security engineer")) {
      roleSpecificSkills = [
        { name: "Threat Modeling", category: technicalCategory, description: "Identifying potential security threats and vulnerabilities" },
        { name: "Security Testing", category: technicalCategory, description: "Performing penetration testing and security assessments" },
        { name: "Network Security", category: technicalCategory, description: "Securing network infrastructure and traffic" },
        { name: "Identity & Access Management", category: technicalCategory, description: "Implementing proper authentication and authorization controls" },
        { name: "Incident Response", category: technicalCategory, description: "Responding to and analyzing security incidents" },
        { name: "Security Tools", category: toolsCategory, description: "Using tools for vulnerability scanning, packet analysis, etc." },
        { name: "Cryptography", category: technicalCategory, description: "Implementing and managing encryption solutions" },
        { name: "Security Compliance", category: domainCategory, description: "Understanding security standards and regulations (GDPR, SOC2, etc.)" },
        { name: "Secure Coding Practices", category: technicalCategory, description: "Writing code that prevents common security vulnerabilities" },
        { name: "Cloud Security", category: technicalCategory, description: "Securing applications and infrastructure in cloud environments" }
      ];
    }
    // Add a default case for any other roles
    else {
      roleSpecificSkills = [
        { name: "Industry Knowledge", category: domainCategory, description: `Understanding of ${industry} industry standards and best practices` },
        { name: "Technical Expertise", category: technicalCategory, description: `Technical proficiency relevant to ${roleTitle} role` },
        { name: "Professional Development", category: softCategory, description: "Continuous learning and skill development" },
        { name: "Project Management", category: managementCategory, description: "Planning, executing, and closing projects effectively" },
        { name: "Analytical Thinking", category: softCategory, description: "Ability to analyze complex problems and develop solutions" },
        { name: "Industry Tools", category: toolsCategory, description: `Proficiency with tools commonly used in ${roleTitle} role` }
      ];
    }
    
    // Add some common soft skills to all roles
    return [...roleSpecificSkills, ...commonSoftSkills];
  }

  // Get skills for a target role
  app.get(
    "/api/skills/role/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.roleId);
        const role = await storage.getInterviewRole(roleId);
        
        if (!role) {
          return res.status(404).json({ message: "Role not found" });
        }
        
        // Generate role-specific skills based on the role title and industry
        const requiredSkills = generateRoleSpecificSkills(role.title, role.industry);
        
        // Function to determine realistic proficiency level for skills based on industry standards
        const getRealisticProficiencyLevel = (skillName: string, index: number, totalSkills: number): number => {
          // Check if the role already has defined required skill levels
          if (role.requiredSkillLevels && typeof role.requiredSkillLevels === 'object') {
            const skillLevels = role.requiredSkillLevels as Record<string, number>;
            if (skillLevels[skillName]) {
              return skillLevels[skillName];
            }
          }
          
          // Determine skill importance based on position in array (earlier skills are often more critical)
          // First 30% of skills are primary skills (higher proficiency required)
          // Next 40% are secondary skills (medium proficiency required)
          // Last 30% are tertiary skills (lower proficiency still acceptable)
          const primarySkillCount = Math.ceil(totalSkills * 0.3);
          const secondarySkillCount = Math.ceil(totalSkills * 0.4);
          
          // Get role level to adjust base proficiency
          // Higher levels require higher proficiency
          const roleLevelMap: Record<string, number> = {
            'Entry': 60,
            'Junior': 70,
            'Mid': 80,
            'Mid-level': 80,
            'Senior': 85,
            'Lead': 90,
            'Director': 95,
            'C-level': 95
          };
          
          // Base proficiency for role level (default to 75 if level not found)
          const baseLevel = roleLevelMap[role.level] || 75;
          
          // Adjust proficiency based on skill importance
          if (index < primarySkillCount) {
            // Primary skills: higher proficiency (base + 10-15%)
            return Math.min(baseLevel + 10 + Math.floor(Math.random() * 6), 95);
          } else if (index < primarySkillCount + secondarySkillCount) {
            // Secondary skills: moderate proficiency (base +/- 5%)
            return Math.min(baseLevel + Math.floor(Math.random() * 10) - 5, 90);
          } else {
            // Tertiary skills: lower proficiency (base - 5-15%)
            return Math.max(baseLevel - 5 - Math.floor(Math.random() * 10), 50);
          }
        };
        
        // Create skill objects for the generated required skills
        const generatedSkills = requiredSkills.map((skillInfo, index) => {
          const targetLevel = getRealisticProficiencyLevel(
            skillInfo.name, 
            index, 
            requiredSkills.length
          );
          
          return {
            id: -1 * (index + 1), // Use negative IDs for temp skills
            name: skillInfo.name,
            category: skillInfo.category,
            description: skillInfo.description || `Skill required for ${role.title} role`,
            industryStandardLevel: targetLevel
          };
        });
        
        return res.json(generatedSkills);
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

        // Handle negative skillIds (virtual role-specific skills)
        const skillId = skillDataResult.data.skillId;
        let skillName = "";
        let actualSkillId = skillId;
        
        if (skillId < 0) {
          // This is a virtual skill from a target role
          // First, try to find if we have a matching skill in the database by name
          // Get the role that this skill might be associated with
          const userCareerGoals = await storage.getCareerGoalsByUserId(skillDataResult.data.userId);
          if (userCareerGoals.length > 0 && userCareerGoals[0].targetRoleId) {
            const targetRoleId = parseInt(userCareerGoals[0].targetRoleId);
            const role = await storage.getInterviewRole(targetRoleId);
            
            if (role && Array.isArray(role.requiredSkills)) {
              // Find which skill this negative ID corresponds to
              // We used negative index-based IDs when creating virtual skills
              const skillIndex = Math.abs(skillId) - 1; // Convert back to 0-based index
              if (skillIndex < role.requiredSkills.length) {
                skillName = role.requiredSkills[skillIndex];
                
                // Try to find an existing skill with this name
                const allSkills = await storage.getAllSkills();
                const matchingSkill = allSkills.find(
                  s => s.name.toLowerCase() === skillName.toLowerCase()
                );
                
                if (matchingSkill) {
                  actualSkillId = matchingSkill.id; // Use the real skill ID
                } else {
                  // Create the skill in the database
                  const newSkill = await storage.createSkill({
                    name: skillName,
                    category: "technical", // Default category
                    description: `Skill required for ${role.title} role`
                  });
                  actualSkillId = newSkill.id;
                }
              } else {
                return res.status(404).json({ message: "Invalid skill index for role" });
              }
            }
          }
          
          if (actualSkillId === skillId) {
            // We couldn't resolve the virtual skill
            return res.status(404).json({ message: "Could not resolve virtual skill" });
          }
          
          // Update the skill ID with the actual ID
          skillDataResult.data.skillId = actualSkillId;
        } else {
          // Check if the skill exists for positive IDs
          const existingSkill = await storage.getSkill(skillId);
          if (!existingSkill) {
            return res.status(404).json({ message: "Skill not found" });
          }
          skillName = existingSkill.name;
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
          description: `Updated skill: ${skillName}`,
          metadata: { skillId: actualSkillId, currentLevel: skillDataResult.data.currentLevel }
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
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get resources from database
        let resources = await storage.getAllLearningResources();
        
        // Check if we have resources - if not, generate predefined ones
        if (!resources || resources.length === 0) {
          console.log("[INFO] No learning resources found in database, generating predefined resources");
          
          // Create predefined resources for common roles
          const predefinedResources = generatePredefinedLearningResources();
          
          // Save these resources to the database for future use
          for (const resource of predefinedResources) {
            try {
              await storage.createLearningResource(resource);
            } catch (err) {
              console.error("Error creating predefined resource:", err);
            }
          }
          
          // Try to get the resources again after creating them
          resources = await storage.getAllLearningResources();
          
          // If still no resources, return the generated ones directly
          if (!resources || resources.length === 0) {
            return res.json(predefinedResources);
          }
        }
        
        // If user ID is provided, customize resources based on user's career goal
        const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
        if (userId) {
          try {
            const careerGoals = await storage.getCareerGoalsByUserId(userId);
            if (careerGoals && careerGoals.length > 0 && careerGoals[0].targetRoleId) {
              const targetRoleId = careerGoals[0].targetRoleId;
              console.log(`[DEBUG] Customizing learning resources for user ${userId} with target role ID ${targetRoleId}`);
              
              // Get the target role
              const roles = await storage.getRoles();
              const targetRole = roles.find((r: any) => r.id.toString() === targetRoleId.toString());
              
              if (targetRole && targetRole.requiredSkills) {
                // Add role-specific resources if they're not already in the list
                const roleSpecificResources = generateRoleSpecificResources(targetRole.title, targetRole.requiredSkills);
                
                // Merge existing resources with role-specific ones, avoiding duplicates
                const existingTitles = new Set(resources.map(r => r.title));
                for (const resource of roleSpecificResources) {
                  if (!existingTitles.has(resource.title)) {
                    resources.push(resource as any);
                    existingTitles.add(resource.title);
                    
                    // Save this resource to the database for future use
                    try {
                      await storage.createLearningResource(resource);
                    } catch (err) {
                      console.error("Error creating role-specific resource:", err);
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error("Error customizing resources for user:", err);
          }
        }
        
        res.json(resources);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Helper function to generate predefined learning resources
  function generatePredefinedLearningResources() {
    return [
      // Software Development Resources
      {
        title: "Modern JavaScript for Full-Stack Web Development",
        description: "Master JavaScript for building full-stack web applications with Node.js and React.",
        resourceType: "course",
        url: "https://javascript.info/",
        provider: "JavaScript.info",
        skillIds: ["1", "2", "3"],
        duration: 30
      },
      {
        title: "Web Development Bootcamp",
        description: "Comprehensive course covering HTML, CSS, JavaScript, React, Node.js, and more.",
        resourceType: "course",
        url: "https://www.udemy.com/course/the-web-developer-bootcamp/",
        provider: "Udemy",
        skillIds: ["4", "5"],
        duration: 40
      },
      {
        title: "Data Structures and Algorithms in Python",
        description: "Master essential computer science concepts for technical interviews and real-world problem solving.",
        resourceType: "course",
        url: "https://www.educative.io/courses/data-structures-algorithms-python",
        provider: "Educative",
        skillIds: ["6", "7"],
        duration: 25
      },
      {
        title: "System Design for Software Engineers",
        description: "Learn how to design scalable systems and prepare for system design interviews.",
        resourceType: "course",
        url: "https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers",
        provider: "Educative",
        skillIds: ["8", "9"],
        duration: 20
      },

      // Data & AI Resources
      {
        title: "Deep Learning Specialization",
        description: "Master deep learning fundamentals and build real-world AI applications.",
        resourceType: "course",
        url: "https://www.deeplearning.ai/courses/deep-learning-specialization/",
        provider: "DeepLearning.AI",
        skillIds: ["10", "11"],
        duration: 40
      },
      {
        title: "Machine Learning Engineering for Production (MLOps)",
        description: "Learn to design and implement production ML systems and workflows.",
        resourceType: "course",
        url: "https://www.deeplearning.ai/courses/machine-learning-engineering-for-production-mlops/",
        provider: "DeepLearning.AI",
        skillIds: ["12", "13"],
        duration: 30
      },
      {
        title: "SQL for Data Analysis",
        description: "Master SQL for efficient data extraction, transformation, and analysis.",
        resourceType: "workshop",
        url: "https://www.datacamp.com/courses/sql-for-data-science",
        provider: "DataCamp",
        skillIds: ["14", "15"],
        duration: 15
      },

      // Cloud & DevOps Resources
      {
        title: "AWS Certified Solutions Architect",
        description: "Prepare for the AWS Solutions Architect certification with hands-on training.",
        resourceType: "course",
        url: "https://acloud.guru/learn/aws-certified-solutions-architect-associate",
        provider: "A Cloud Guru",
        skillIds: ["16", "17"],
        duration: 35
      },
      {
        title: "Docker and Kubernetes: The Complete Guide",
        description: "Master containerization and orchestration for modern application deployment.",
        resourceType: "course",
        url: "https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/",
        provider: "Udemy",
        skillIds: ["18", "19"],
        duration: 30
      },
      {
        title: "Infrastructure as Code with Terraform",
        description: "Learn to automate infrastructure provisioning with Terraform.",
        resourceType: "workshop",
        url: "https://learn.hashicorp.com/terraform",
        provider: "HashiCorp",
        skillIds: ["20", "21"],
        duration: 20
      },
      
      // Financial & Risk Analysis Resources
      {
        title: "Financial Risk Management",
        description: "Learn the fundamentals of risk modeling and management in financial institutions.",
        resourceType: "course",
        url: "https://www.youtube.com/watch?v=GjPMlI4J3F0",
        provider: "YouTube - Corporate Finance Institute",
        skillIds: ["21", "22", "23", "24"],
        duration: 25
      },
      {
        title: "Statistics for Data Science and Business Analysis",
        description: "Master statistical analysis techniques essential for risk assessment and data analysis.",
        resourceType: "course",
        url: "https://www.youtube.com/watch?v=xxpc-HPKN28",
        provider: "YouTube - freeCodeCamp.org",
        skillIds: ["25", "26", "27", "28"],
        duration: 40
      },
      
      // Agile & Scrum Resources 
      {
        title: "Scrum: A Breathtakingly Brief and Agile Introduction",
        description: "A quick and comprehensive introduction to Scrum methodologies and principles.",
        resourceType: "article",
        url: "https://www.youtube.com/watch?v=9TycLR0TqFA",
        provider: "YouTube - Scrum.org",
        skillIds: ["16"],
        duration: 15
      },
      {
        title: "Agile Project Management with Scrum",
        description: "Learn the principles of Agile facilitation and Scrum methodology.",
        resourceType: "course",
        url: "https://www.youtube.com/watch?v=9TycLR0TqFA",
        provider: "YouTube - Development That Pays",
        skillIds: ["16"],
        duration: 30
      },
      {
        title: "Sprint Planning Best Practices",
        description: "Master effective sprint planning techniques for Scrum teams.",
        resourceType: "video",
        url: "https://www.youtube.com/watch?v=2A9rkiIcnVI",
        provider: "YouTube - Atlassian",
        skillIds: ["16"],
        duration: 20
      },
      {
        title: "Conflict Resolution for Agile Teams",
        description: "Learn how to manage and resolve conflicts in Agile and Scrum environments.",
        resourceType: "course",
        url: "https://www.youtube.com/watch?v=qDfSYz0PX9g",
        provider: "YouTube - Scrum.org",
        skillIds: ["16"],
        duration: 25
      },
      {
        title: "Servant Leadership in Scrum",
        description: "Understand the principles of servant leadership as a Scrum Master.",
        resourceType: "workshop",
        url: "https://www.youtube.com/watch?v=kJdXjtSnZTI",
        provider: "YouTube - Scrum.org",
        skillIds: ["16"],
        duration: 30
      },
      {
        title: "Continuous Improvement: Kaizen in Scrum",
        description: "Learn how to implement continuous improvement practices in Scrum teams.",
        resourceType: "course",
        url: "https://www.youtube.com/watch?v=VGLjoMPJzXo",
        provider: "YouTube - Agile for All",
        skillIds: ["16"],
        duration: 20
      },

      // Cybersecurity Resources
      {
        title: "Practical Ethical Hacking",
        description: "Comprehensive course on ethical hacking methodologies and tools.",
        resourceType: "course",
        url: "https://www.udemy.com/course/practical-ethical-hacking/",
        provider: "Udemy",
        skillIds: ["22", "23"],
        duration: 35
      },
      {
        title: "CompTIA Security+ Certification",
        description: "Prepare for the Security+ certification with comprehensive coverage of security fundamentals.",
        resourceType: "course",
        url: "https://www.comptia.org/training/by-certification/security",
        provider: "CompTIA",
        skillIds: ["24", "25"],
        duration: 30
      },

      // Project Management Resources
      {
        title: "Agile Project Management with Scrum",
        description: "Master Scrum methodology and become an effective Agile project manager.",
        resourceType: "course",
        url: "https://www.coursera.org/learn/agile-project-management",
        provider: "Coursera",
        skillIds: ["26", "27"],
        duration: 20
      },
      {
        title: "Project Management Professional (PMP) Certification",
        description: "Comprehensive preparation for the PMP certification exam.",
        resourceType: "course",
        url: "https://www.pmi.org/certifications/project-management-pmp",
        provider: "PMI",
        skillIds: ["28", "29"],
        duration: 35
      }
    ];
  }
  
  // Helper function to generate role-specific learning resources
  function generateRoleSpecificResources(roleTitle: string, requiredSkills: string[]) {
    const resources = [];
    
    // Base resources for the role
    resources.push({
      title: `Complete Guide to ${roleTitle}`,
      description: `A comprehensive guide covering all aspects of becoming a successful ${roleTitle}.`,
      resourceType: "course",
      url: `https://www.udemy.com/course/${roleTitle.toLowerCase().replace(/\s+/g, '-')}-guide`,
      provider: "Udemy",
      skillIds: [],
      duration: 30
    });
    
    resources.push({
      title: `${roleTitle} Certification Preparation`,
      description: `Prepare for industry certification as a ${roleTitle} with this course.`,
      resourceType: "course",
      url: `https://www.coursera.org/professional-certificates/${roleTitle.toLowerCase().replace(/\s+/g, '-')}`,
      provider: "Coursera",
      skillIds: [],
      duration: 40
    });
    
    // Add resources for each required skill
    if (requiredSkills && requiredSkills.length > 0) {
      requiredSkills.forEach((skill, index) => {
        resources.push({
          title: `Mastering ${skill}`,
          description: `An in-depth course on ${skill} for aspiring ${roleTitle}s.`,
          resourceType: "course",
          url: `https://www.pluralsight.com/courses/${skill.toLowerCase().replace(/\s+/g, '-')}`,
          provider: "Pluralsight",
          skillIds: [(index + 100).toString()], // Using arbitrary IDs
          duration: 20
        });
        
        // Add a book resource for alternate learning style
        resources.push({
          title: `${skill}: A Practical Guide`,
          description: `The essential handbook for understanding ${skill} in professional contexts.`,
          resourceType: "book",
          url: `https://www.amazon.com/${skill.toLowerCase().replace(/\s+/g, '-')}-practical-guide`,
          provider: "Various Publishers",
          skillIds: [(index + 100).toString()],
          duration: 15
        });
      });
    }
    
    // Add role-specific custom resources based on IT industry roles
    // Software Development & Engineering roles
    if (roleTitle === "Frontend Developer") {
      resources.push(
        {
          title: "Advanced React Patterns",
          description: "Master advanced React patterns and performance optimization techniques.",
          resourceType: "course",
          url: "https://frontendmasters.com/courses/advanced-react-patterns/",
          provider: "Frontend Masters",
          skillIds: ["100"],
          duration: 25
        },
        {
          title: "Modern CSS Techniques",
          description: "Learn cutting-edge CSS techniques including Grid, Flexbox, and CSS variables.",
          resourceType: "course",
          url: "https://css-tricks.com/guides/",
          provider: "CSS-Tricks",
          skillIds: ["101"],
          duration: 20
        }
      );
    } else if (roleTitle === "Backend Developer") {
      resources.push(
        {
          title: "Microservices Architecture Patterns",
          description: "Learn how to design, implement, and deploy microservices at scale.",
          resourceType: "course",
          url: "https://www.pluralsight.com/courses/microservices-architecture",
          provider: "Pluralsight",
          skillIds: ["102"],
          duration: 30
        },
        {
          title: "Database Performance Optimization",
          description: "Master techniques for optimizing database performance in high-scale applications.",
          resourceType: "workshop",
          url: "https://www.linkedin.com/learning/database-performance-optimization",
          provider: "LinkedIn Learning",
          skillIds: ["103"],
          duration: 20
        }
      );
    } else if (roleTitle === "Full Stack Developer") {
      resources.push(
        {
          title: "Modern Web Application Architecture",
          description: "Comprehensive course on building scalable full-stack web applications.",
          resourceType: "course",
          url: "https://www.udemy.com/course/full-stack-web-development/",
          provider: "Udemy",
          skillIds: ["104"],
          duration: 35
        },
        {
          title: "API Design Best Practices",
          description: "Learn how to design robust and scalable APIs using REST and GraphQL.",
          resourceType: "workshop",
          url: "https://www.apollographql.com/tutorials/",
          provider: "Apollo GraphQL",
          skillIds: ["105"],
          duration: 15
        }
      );
    } 
    // Artificial Intelligence & Machine Learning roles
    else if (roleTitle === "AI Research Scientist") {
      resources.push(
        {
          title: "Advanced Deep Learning Techniques",
          description: "Explore cutting-edge deep learning research and implementation.",
          resourceType: "course",
          url: "https://www.deeplearning.ai/courses/advanced-techniques/",
          provider: "DeepLearning.AI",
          skillIds: ["106"],
          duration: 40
        },
        {
          title: "Research Paper Implementation Workshop",
          description: "Learn how to implement and reproduce AI research papers from scratch.",
          resourceType: "workshop",
          url: "https://paperswithcode.com/",
          provider: "Papers With Code",
          skillIds: ["107"],
          duration: 25
        }
      );
    } else if (roleTitle === "Natural Language Processing (NLP) Engineer") {
      resources.push(
        {
          title: "Deep Learning for Natural Language Processing",
          description: "Advanced course on using deep learning techniques for NLP tasks.",
          resourceType: "course",
          url: "https://www.fast.ai/courses/nlp",
          provider: "fast.ai",
          skillIds: ["198"],
          duration: 35
        },
        {
          title: "Modern Natural Language Processing in Python",
          description: "Learn to build state-of-the-art NLP systems using Python and transformers.",
          resourceType: "course",
          url: "https://www.deeplearning.ai/courses/natural-language-processing",
          provider: "DeepLearning.AI",
          skillIds: ["198"],
          duration: 25
        }
      );
    } else if (roleTitle === "Computer Vision Developer") {
      resources.push(
        {
          title: "Advanced Computer Vision with Deep Learning",
          description: "Master computer vision techniques using convolutional neural networks and transformers.",
          resourceType: "course",
          url: "https://www.coursera.org/specializations/deep-learning",
          provider: "Coursera",
          skillIds: ["108"],
          duration: 30
        },
        {
          title: "Real-time Computer Vision Applications",
          description: "Build real-time computer vision applications for various platforms.",
          resourceType: "workshop",
          url: "https://opencv.org/courses/",
          provider: "OpenCV",
          skillIds: ["109"],
          duration: 20
        }
      );
    }
    // Data & Analytics roles
    else if (roleTitle === "Data Scientist") {
      resources.push(
        {
          title: "Advanced Statistical Methods for Data Science",
          description: "Learn advanced statistical techniques for complex data analysis.",
          resourceType: "course",
          url: "https://www.statsmodels.org/stable/examples/",
          provider: "StatsModels",
          skillIds: ["110"],
          duration: 30
        },
        {
          title: "Causal Inference in Data Science",
          description: "Master causal inference techniques to move beyond correlations in data.",
          resourceType: "course",
          url: "https://www.datacamp.com/courses/causal-inference",
          provider: "DataCamp",
          skillIds: ["111"],
          duration: 25
        }
      );
    } else if (roleTitle === "Business Intelligence (BI) Developer") {
      resources.push(
        {
          title: "Advanced Data Visualization Techniques",
          description: "Create compelling and interactive data visualizations for business insights.",
          resourceType: "course",
          url: "https://www.tableau.com/learn/training",
          provider: "Tableau",
          skillIds: ["112"],
          duration: 20
        },
        {
          title: "Building Enterprise BI Solutions",
          description: "Learn how to design and implement enterprise-scale BI solutions.",
          resourceType: "workshop",
          url: "https://powerbi.microsoft.com/en-us/learning/",
          provider: "Microsoft Power BI",
          skillIds: ["113"],
          duration: 25
        }
      );
    }
    // Project & Product Management roles
    else if (roleTitle === "Agile Coach") {
      resources.push(
        {
          title: "Professional Agile Coaching",
          description: "Learn advanced coaching techniques to help teams excel with agile methodologies.",
          resourceType: "course",
          url: "https://www.scrumalliance.org/courses/agile-coaching",
          provider: "Scrum Alliance",
          skillIds: ["218"],
          duration: 30
        },
        {
          title: "Team Facilitation for Agile Coaches",
          description: "Master the art of facilitating high-performing agile teams.",
          resourceType: "workshop",
          url: "https://www.agilecoachinginstitute.com/team-facilitation",
          provider: "Agile Coaching Institute",
          skillIds: ["218"],
          duration: 20
        }
      );
    } else if (roleTitle === "IT Project Manager") {
      resources.push(
        {
          title: "Advanced Project Management Methodologies",
          description: "Master various project management approaches for complex IT projects.",
          resourceType: "course",
          url: "https://www.pmi.org/learning/courses",
          provider: "Project Management Institute",
          skillIds: ["114"],
          duration: 35
        },
        {
          title: "Stakeholder Management in IT Projects",
          description: "Learn effective strategies for managing stakeholders in IT projects.",
          resourceType: "workshop",
          url: "https://www.coursera.org/learn/project-management-skills",
          provider: "Coursera",
          skillIds: ["115"],
          duration: 15
        }
      );
    }
    // Cloud Computing & DevOps roles
    else if (roleTitle === "DevOps Engineer") {
      resources.push(
        {
          title: "CI/CD Pipeline Mastery",
          description: "Build advanced continuous integration and delivery pipelines.",
          resourceType: "course",
          url: "https://www.pluralsight.com/courses/devops-engineering",
          provider: "Pluralsight",
          skillIds: ["116"],
          duration: 30
        },
        {
          title: "Infrastructure as Code with Terraform",
          description: "Learn how to manage cloud infrastructure using code with Terraform.",
          resourceType: "workshop",
          url: "https://learn.hashicorp.com/terraform",
          provider: "HashiCorp",
          skillIds: ["117"],
          duration: 25
        }
      );
    } else if (roleTitle === "Cloud Solutions Architect") {
      resources.push(
        {
          title: "Multi-Cloud Architecture Design",
          description: "Design resilient and scalable applications across multiple cloud providers.",
          resourceType: "course",
          url: "https://acloud.guru/learn/aws-certified-solutions-architect-professional",
          provider: "A Cloud Guru",
          skillIds: ["118"],
          duration: 40
        },
        {
          title: "Cloud Security Architecture",
          description: "Learn best practices for securing applications in the cloud.",
          resourceType: "workshop",
          url: "https://www.sans.org/cloud-security",
          provider: "SANS Institute",
          skillIds: ["119"],
          duration: 25
        }
      );
    }
    // Cybersecurity roles
    else if (roleTitle === "Security Operations Center (SOC) Analyst") {
      resources.push(
        {
          title: "Threat Hunting Techniques",
          description: "Learn advanced threat hunting methodologies for SOC analysts.",
          resourceType: "course",
          url: "https://www.sans.org/course/advanced-incident-response-threat-hunting-training",
          provider: "SANS Institute",
          skillIds: ["120"],
          duration: 35
        },
        {
          title: "SIEM Implementation and Management",
          description: "Master the implementation and management of Security Information and Event Management systems.",
          resourceType: "workshop",
          url: "https://www.splunk.com/en_us/training/courses/splunk-security-essentials",
          provider: "Splunk",
          skillIds: ["121"],
          duration: 25
        }
      );
    } else if (roleTitle === "Penetration Tester (Ethical Hacker)") {
      resources.push(
        {
          title: "Advanced Penetration Testing",
          description: "Learn advanced techniques for ethical hacking and penetration testing.",
          resourceType: "course",
          url: "https://www.offensive-security.com/pwk-oscp/",
          provider: "Offensive Security",
          skillIds: ["122"],
          duration: 40
        },
        {
          title: "Web Application Security Testing",
          description: "Master techniques for finding and exploiting web application vulnerabilities.",
          resourceType: "workshop",
          url: "https://portswigger.net/web-security",
          provider: "PortSwigger",
          skillIds: ["123"],
          duration: 30
        }
      );
    }
    
    return resources;
  }

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
        if (isNaN(skillId)) {
          return res.status(400).json({ message: "Invalid skill ID" });
        }

        // Get resources for this skill
        let resources = await storage.getLearningResourcesBySkill(skillId);
        
        // If no resources found for this skill, generate free resources on demand
        if (!resources || resources.length === 0) {
          console.log(`[INFO] No resources found for skill ID ${skillId}, generating resources`);
          
          // Get the skill information
          const skill = await storage.getSkill(skillId);
          
          if (skill) {
            console.log(`[INFO] Found skill: ${skill.name} (${skill.category})`);
            
            // Create free resources for this skill
            const freeResources = [
              {
                title: `${skill.name} Fundamentals`,
                description: `Learn the fundamentals of ${skill.name} with this free course.`,
                resourceType: "course",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name)}+tutorial`,
                provider: "YouTube",
                skillIds: [skill.id.toString()],
                duration: 30
              },
              {
                title: `${skill.name} Quick Guide`,
                description: `A quick overview of ${skill.name} for busy professionals.`,
                resourceType: "video",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name)}+quick+guide`,
                provider: "YouTube",
                skillIds: [skill.id.toString()],
                duration: 15
              }
            ];
            
            // Add special resources for Agile/Scrum skills
            if (
              skill.name === "Agile Facilitation" || 
              skill.name === "Servant Leadership" || 
              skill.name === "Sprint Planning" || 
              skill.name === "Conflict Resolution" || 
              skill.name === "Continuous Improvement" ||
              skill.name.includes("Agile") ||
              skill.name.includes("Scrum")
            ) {
              freeResources.push({
                title: `${skill.name} for Scrum Masters`,
                description: `Learn how to apply ${skill.name} in the Scrum Master role.`,
                resourceType: "course",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name)}+scrum+master`,
                provider: "YouTube",
                skillIds: [skill.id.toString()],
                duration: 25
              });
            }
            
            // Save these resources to the database for future use
            for (const resource of freeResources) {
              try {
                await storage.createLearningResource(resource);
              } catch (err) {
                console.error(`Error creating resource for skill ${skill.name}:`, err);
              }
            }
            
            // Try to get the resources again after creating them
            resources = await storage.getLearningResourcesBySkill(skillId);
          }
        }
        
        res.json(resources || []);
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

        let learningPaths = await storage.getLearningPathsByUserId(userId);
        
        // Check if we need to update learning path titles based on current career goal
        const currentGoal = await storage.getLatestCareerGoalByUserId(userId);
        if (currentGoal) {
          
          console.log("[DEBUG] Checking learning paths for consistency with current goal:", {
            goalTitle: currentGoal.title,
            pathCount: learningPaths.length,
            targetRoleId: currentGoal.targetRoleId
          });
          
          // Update any learning paths with outdated career titles
          const updatedPaths = [];
          for (const path of learningPaths) {
            // If title is out of sync with current goal, update it
            if (path.title && !path.title.includes(currentGoal.title)) {
              console.log(`[DEBUG] Updating learning path title from "${path.title}" to "Learning Path for ${currentGoal.title}"`);
              
              // Update the learning path in the database
              const updatedPath = await storage.updateLearningPath(path.id, {
                title: `Learning Path for ${currentGoal.title}`,
                description: `A personalized learning path to help you achieve your goal of becoming a ${currentGoal.title}`
              });
              
              if (updatedPath) {
                updatedPaths.push(updatedPath);
              } else {
                updatedPaths.push(path);
              }
            } else {
              updatedPaths.push(path);
            }
          }
          
          learningPaths = updatedPaths;
        }
        
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

        // Try to get legacy progress (for backward compatibility)
        let legacyProgress = [];
        try {
          legacyProgress = await storage.getUserProgressByUserId(userId);
        } catch (legacyError) {
          console.warn("Legacy progress not available:", legacyError.message);
          // Continue even if legacy progress fails - it's just for backward compatibility
        }
        
        // Get current career goal and associated target role data
        const careerGoal = await storage.getLatestCareerGoalByUserId(userId);
        let targetRole = null;
        
        if (careerGoal && careerGoal.targetRoleId) {
          // Use getInterviewRole instead of getRoleById
          targetRole = await storage.getInterviewRole(careerGoal.targetRoleId);
        }
        
        // Get new detailed progress statistics using the new method
        const progressStats = await storage.calculateUserProgressStats(userId);
        
        // Return both legacy progress data and new structure, plus target role info
        res.json({
          ...progressStats,
          targetRole: targetRole,
          careerGoal: careerGoal,
          legacyProgress: Array.isArray(legacyProgress) ? legacyProgress : []  // Ensure it's always an array
        });
      } catch (error) {
        console.error("Error fetching user progress:", error);
        next(error);
      }
    }
  );

  // Mark a resource as completed
  app.post(
    "/api/users/:userId/resources/:resourceId/complete",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        const resourceId = parseInt(req.params.resourceId);
        
        // Check if user is updating their own progress
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // Check if this resource is already marked as completed
        const existingProgress = await storage.getUserResourceProgressByUserAndResource(userId, resourceId);
        
        if (existingProgress) {
          return res.status(409).json({ message: "Resource already marked as completed" });
        }
        
        // Create progress record
        const newProgress = await storage.createUserResourceProgress({
          userId,
          resourceId,
          rating: req.body.rating,
          feedback: req.body.feedback,
          timeSpentMinutes: req.body.timeSpentMinutes
        });
        
        // Return the newly created progress record
        res.status(201).json(newProgress);
      } catch (error) {
        console.error("Error marking resource as completed:", error);
        next(error);
      }
    }
  );
  
  // Un-mark a resource as completed
  app.delete(
    "/api/users/:userId/resources/:resourceId/complete",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = parseInt(req.params.userId);
        const resourceId = parseInt(req.params.resourceId);
        
        // Check if user is updating their own progress
        if (req.user && (req.user as any).id !== userId) {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        // Find the progress record
        const existingProgress = await storage.getUserResourceProgressByUserAndResource(userId, resourceId);
        
        if (!existingProgress) {
          return res.status(404).json({ message: "No completion record found for this resource" });
        }
        
        // Delete the progress record
        await storage.deleteUserResourceProgress(existingProgress.id);
        
        // Return success
        res.status(200).json({ message: "Resource completion record deleted successfully" });
      } catch (error) {
        console.error("Error removing resource completion:", error);
        next(error);
      }
    }
  );
  
  // Legacy endpoint - Update user progress for a resource
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

        console.log(`[DEBUG] Generate Learning Path - Using career goal:`, {
          id: careerGoal.id,
          title: careerGoal.title,
          targetRoleId: careerGoal.targetRoleId,
          targetRoleIdType: typeof careerGoal.targetRoleId
        });

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
        const { careerGoalId, targetRoleId, forceRefresh } = req.body;

        console.log("[INFO] Generating skill gap analysis:", { userId, careerGoalId, targetRoleId, forceRefresh });

        if (!careerGoalId) {
          return res.status(400).json({ message: "Career goal ID is required" });
        }

        // Get career goal
        const careerGoal = await storage.getCareerGoal(parseInt(careerGoalId));
        if (!careerGoal) {
          return res.status(404).json({ message: "Career goal not found" });
        }
        
        // If targetRoleId is provided and different from the career goal's targetRoleId,
        // we'll use it for this analysis but won't update the stored career goal
        const effectiveTargetRoleId = targetRoleId || careerGoal.targetRoleId;
        
        // If targetRoleId is different, log the override
        if (targetRoleId && targetRoleId !== careerGoal.targetRoleId) {
          console.log(`[INFO] Overriding targetRoleId for analysis: ${careerGoal.targetRoleId} -> ${targetRoleId}`);
        }
        
        // Get the target role details if we have a targetRoleId
        let targetRole = null;
        if (effectiveTargetRoleId) {
          try {
            const roles = await storage.getRoles();
            targetRole = roles.find((r: any) => r.id.toString() === effectiveTargetRoleId.toString());
            
            if (targetRole) {
              console.log(`[INFO] Using target role for analysis: ${targetRole.title}`);
              
              // Use target role info for the analysis context
              const targetRoleInfo = {
                title: targetRole.title,
                id: targetRole.id
              };
              // Add in a type-safe way
              (careerGoal as any).targetRoleTitle = targetRoleInfo.title;
            }
          } catch (error) {
            console.error("Error fetching roles:", error);
          }
        }

        // Get user skills
        const userSkills = await storage.getUserSkillsWithDetails(userId);
        
        // Get all skills
        const allSkills = await storage.getAllSkills();

        // Generate skill gap analysis using OpenAI (if the API key is available)
        let gapAnalysis;
        try {
          // Update the API call with more detailed prompting based on target role
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: `You are an AI career advisor that specializes in identifying skill gaps based on users' current skills and career goals.
                
                Your task is to identify specific skill gaps relevant to the user's target role (${targetRole?.title || careerGoal.title}).
                
                For each skill gap, provide:
                1. The skill name
                2. Current proficiency level (0-100)
                3. Required level for the target role (0-100)
                4. Priority (high, medium, low)
                5. A brief explanation of why this skill is important for the target role
                
                You should focus on both:
                - Skills the user completely lacks (missing skills)
                - Skills the user has but needs to improve (underdeveloped skills)
                
                Make your analysis specific to the exact target role (${targetRole?.title || careerGoal.title}). 
                Tailor the required skill levels based on industry standards for this specific role.`
              },
              {
                role: "user",
                content: JSON.stringify({
                  careerGoal: careerGoal,
                  targetRole: targetRole,
                  userSkills: userSkills,
                  allSkills: allSkills,
                  forceRefresh: !!forceRefresh // Boolean indicating if this is a manual refresh request
                })
              }
            ],
            response_format: { type: "json_object" }
          });

          gapAnalysis = JSON.parse(response.choices[0].message.content);
        } catch (error) {
          console.error("OpenAI API error:", error);
          
          // Create role-specific skills based on the target role or a default set
          let roleSpecificSkills: string[] = [];
          
          // If we have target role with required skills, use those
          if (targetRole && targetRole.requiredSkills && Array.isArray(targetRole.requiredSkills)) {
            console.log(`Using role-specific skills for ${targetRole.title}`);
            roleSpecificSkills = targetRole.requiredSkills.slice(0, 5);
          } 
          // Otherwise generate some based on the role name
          else if (targetRole && targetRole.title) {
            console.log(`Generating skills for ${targetRole.title} without required skills data`);
            
            // Map common role titles to typical skills
            const roleMap: Record<string, string[]> = {
              'Agile Coach': ['Agile Frameworks', 'Team Coaching', 'Scrum', 'Kanban', 'Sprint Planning'],
              'Marketing Manager': ['Marketing Strategy', 'Campaign Management', 'Market Research', 'Brand Development', 'Lead Generation'],
              'Software Engineer': ['Programming', 'Algorithms', 'System Design', 'Testing', 'DevOps'],
              'Data Scientist': ['Data Analysis', 'Machine Learning', 'Statistics', 'Python', 'Data Visualization'],
              'UX Designer': ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Interaction Design'],
              'Project Manager': ['Project Planning', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership'],
              'Product Manager': ['Product Strategy', 'Market Analysis', 'Roadmapping', 'User Stories', 'Feature Prioritization'],
              'Financial Analyst': ['Financial Modeling', 'Forecasting', 'Valuation', 'Excel', 'Financial Reporting'],
              'Operations Manager': ['Process Improvement', 'Team Management', 'Inventory Management', 'Quality Control', 'Supply Chain'],
              'Risk Analyst': ['Risk Assessment', 'Compliance', 'Data Analysis', 'Regulation Knowledge', 'Financial Modeling']
            };
            
            // Use the matched role skills or a default set
            roleSpecificSkills = roleMap[targetRole.title] || 
              ['Communication', 'Problem Solving', 'Time Management', 'Teamwork', 'Technology Skills'];
          }
          // Fallback to generic skills
          else {
            console.log('Using generic skills (no target role data)');
            roleSpecificSkills = ['Communication', 'Problem Solving', 'Time Management', 'Teamwork', 'Technology Skills'];
          }
          
          // Create skill gap objects from role-specific skills
          const skillGaps = roleSpecificSkills.map((skillName, index) => ({
            skillId: 1000 + index, // Use high IDs to avoid collisions with real skills
            skillName,
            currentLevel: Math.floor(Math.random() * 40), // Random current level 0-40
            requiredLevel: 70 + Math.floor(Math.random() * 20), // Random required level 70-90
            priority: "high"
          }));

          const roleName = targetRole?.title || careerGoal.title;
          
          gapAnalysis = {
            careerGoal: careerGoal.title,
            overallReadiness: Math.floor(Math.random() * 50) + 20, // Random number between 20-70%
            targetRole: roleName, // Include the target role
            skillGaps: skillGaps.map(sg => ({
              ...sg,
              targetRole: roleName // Add target role to each skill gap
            })),
            recommendations: [
              `Focus on building ${roleName} skills first`,
              "Consider taking courses in relevant areas",
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
  
  // AI-powered career plan generation
  app.post(
    "/api/ai/career-plan",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = (req.user as any).id;
        const { careerGoalId, targetRole, skills, timeline } = req.body;

        if (!careerGoalId) {
          return res.status(400).json({ message: "Career goal ID is required" });
        }

        // Get user data
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get career goal
        const careerGoal = await storage.getCareerGoal(parseInt(careerGoalId));
        if (!careerGoal) {
          return res.status(404).json({ message: "Career goal not found" });
        }

        // Get learning resources for recommendations
        const learningResources = await storage.getAllLearningResources();

        // Generate career plan using OpenAI
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: `You are an AI career advisor that creates comprehensive career transition plans. 
                Your task is to generate a step-by-step career plan to help the user transition to their target role.
                Base your plan on the user's current skills, skill gaps, and target timeline.
                
                The career plan should include:
                1. A brief summary of the transition path
                2. Key focus areas (3-5 main categories of skills/knowledge to develop)
                3. 3-5 milestones with specific skills to acquire for each milestone
                4. Estimated timeline in months for the entire transition
                
                Return a JSON object with this structure:
                {
                  "summary": "Brief overview of the career transition path",
                  "estimatedMonths": number,
                  "focusAreas": ["Area 1", "Area 2", ...],
                  "milestones": [
                    {
                      "title": "Milestone title",
                      "description": "Brief description",
                      "skills": ["Skill 1", "Skill 2", ...],
                      "timeframe": "X-Y months"
                    },
                    ...
                  ]
                }`
              },
              {
                role: "user",
                content: JSON.stringify({
                  user: {
                    name: user.name,
                    currentRole: user.currentRole
                  },
                  careerGoal: {
                    title: careerGoal.title,
                    targetRole: targetRole,
                    timelineMonths: timeline
                  },
                  skills: skills,
                  availableLearningResources: learningResources.map(resource => ({
                    title: resource.title,
                    type: resource.type,
                    skill: resource.skill
                  })).slice(0, 20) // Limit to prevent token issues
                })
              }
            ],
            response_format: { type: "json_object" }
          });

          const careerPlan = JSON.parse(response.choices[0].message.content);
          res.json(careerPlan);
        } catch (error) {
          console.error("OpenAI API error:", error);
          
          // Fallback to a basic career plan
          const fallbackPlan = {
            summary: `Transition plan to ${targetRole} focusing on closing key skill gaps over ${timeline} months.`,
            estimatedMonths: timeline,
            focusAreas: [
              "Technical skill development",
              "Industry knowledge acquisition",
              "Building practical experience",
              "Professional network expansion",
            ],
            milestones: [
              {
                title: "Core skill foundation",
                description: "Build fundamental skills required for the role",
                skills: skills.filter(s => s.status === 'missing').slice(0, 3).map(s => s.name),
                timeframe: "1-3 months"
              },
              {
                title: "Skill enhancement",
                description: "Improve existing skills to required levels",
                skills: skills.filter(s => s.status === 'improvement').slice(0, 3).map(s => s.name),
                timeframe: "3-6 months"
              },
              {
                title: "Practical application",
                description: "Apply skills in real-world scenarios",
                skills: skills.filter(s => s.percentage > 50).slice(0, 3).map(s => s.name),
                timeframe: "6-9 months"
              }
            ]
          };
          
          res.json(fallbackPlan);
        }
      } catch (error) {
        next(error);
      }
    }
  );

  // =======================
  // Skill Assessment API
  // =======================
  
  app.get(
    "/api/assessment/skill/:skillId",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const skillId = parseInt(req.params.skillId);
        
        if (isNaN(skillId)) {
          return res.status(400).json({ message: "Invalid skill ID" });
        }
        
        // Get the skill details
        const skill = await storage.getSkill(skillId);
        if (!skill) {
          return res.status(404).json({ message: "Skill not found" });
        }
        
        // Generate assessment questions for this skill using OpenAI
        try {
          const skillName = skill.name;
          const category = skill.category;
          
          // Try to use OpenAI to generate questions
          let assessmentData;
          
          try {
            const response = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: [
                {
                  role: "system",
                  content: `You are an expert skills assessment system. Generate a comprehensive assessment exam for the skill: ${skillName} (category: ${category}).
                  
                  Create 10 multiple-choice questions to thoroughly assess a user's proficiency in this skill.
                  Each question should have 4 options (labeled a, b, c, d) with one correct answer.
                  Include a brief explanation for each correct answer for learning purposes.
                  Create questions with varying difficulty levels (beginner, intermediate, advanced).`
                },
                {
                  role: "user",
                  content: `Create a skill assessment for: ${skillName}`
                }
              ],
              response_format: { type: "json_object" }
            });
            
            const openAIResponse = JSON.parse(response.choices[0].message.content);
            assessmentData = {
              skillId,
              skillName,
              category,
              questions: openAIResponse.questions || []
            };
          } catch (error) {
            console.error("OpenAI API error:", error);
            
            // Fall back to predefined assessment questions
            assessmentData = {
              skillId,
              skillName,
              category,
              questions: [
                {
                  id: 1001,
                  question: `What is a key aspect of ${skillName}?`,
                  options: [
                    { id: "a", text: `Basic understanding of ${skillName} concepts` },
                    { id: "b", text: `Advanced application of ${skillName} principles` },
                    { id: "c", text: `Teaching others about ${skillName}` },
                    { id: "d", text: `None of the above` }
                  ],
                  correctAnswer: "b",
                  explanation: `Advanced application demonstrates true proficiency in ${skillName}.`,
                  skillId,
                  difficulty: "intermediate"
                },
                {
                  id: 1002,
                  question: `Which best describes a fundamental principle of ${skillName}?`,
                  options: [
                    { id: "a", text: "It requires minimal planning" },
                    { id: "b", text: "It's only needed in certain industries" },
                    { id: "c", text: `It involves systematic approach to problem-solving` },
                    { id: "d", text: "It's a temporary trend in the industry" }
                  ],
                  correctAnswer: "c",
                  explanation: `${skillName} fundamentally involves a systematic approach to addressing challenges.`,
                  skillId,
                  difficulty: "beginner"
                },
                {
                  id: 1003,
                  question: `How do professionals typically improve their ${skillName} abilities?`,
                  options: [
                    { id: "a", text: "By avoiding difficult challenges" },
                    { id: "b", text: "Through consistent practice and application" },
                    { id: "c", text: "By focusing only on theory" },
                    { id: "d", text: "It's an innate ability that cannot be improved" }
                  ],
                  correctAnswer: "b",
                  explanation: `Like most skills, ${skillName} improves through deliberate practice and real-world application.`,
                  skillId,
                  difficulty: "beginner"
                },
                {
                  id: 1004,
                  question: `What distinguishes experts in ${skillName} from beginners?`,
                  options: [
                    { id: "a", text: "Experts rely solely on intuition" },
                    { id: "b", text: "Experts never make mistakes" },
                    { id: "c", text: "Experts consider multiple perspectives and approaches" },
                    { id: "d", text: "Experts work faster but with less attention to detail" }
                  ],
                  correctAnswer: "c",
                  explanation: `Expertise in ${skillName} involves nuanced understanding of various approaches and perspectives.`,
                  skillId,
                  difficulty: "intermediate"
                },
                {
                  id: 1005,
                  question: `In a complex project requiring ${skillName}, what's most important?`,
                  options: [
                    { id: "a", text: "Sticking rigidly to the initial plan" },
                    { id: "b", text: "Working alone to maintain focus" },
                    { id: "c", text: "Adapting to changing requirements and feedback" },
                    { id: "d", text: "Minimizing communication to save time" }
                  ],
                  correctAnswer: "c",
                  explanation: `Adaptability and responsiveness to feedback are crucial aspects of applying ${skillName} effectively.`,
                  skillId,
                  difficulty: "advanced"
                },
                {
                  id: 1006,
                  question: `What's a best practice when applying ${skillName} to new situations?`,
                  options: [
                    { id: "a", text: "Apply exactly the same approach every time" },
                    { id: "b", text: "Analyze context before choosing an approach" },
                    { id: "c", text: "Avoid research and rely on instinct" },
                    { id: "d", text: "Skip planning and move directly to implementation" }
                  ],
                  correctAnswer: "b",
                  explanation: `Contextual analysis is essential when applying ${skillName} principles to new situations.`,
                  skillId,
                  difficulty: "intermediate"
                },
                {
                  id: 1007,
                  question: `What mindset supports ongoing growth in ${skillName}?`,
                  options: [
                    { id: "a", text: "Growth mindset with openness to learning" },
                    { id: "b", text: "Belief that skill levels are fixed and unchangeable" },
                    { id: "c", text: "Avoiding challenges to prevent failure" },
                    { id: "d", text: "Focusing only on your strongest abilities" }
                  ],
                  correctAnswer: "a",
                  explanation: `A growth mindset with consistent learning orientation supports long-term development in ${skillName}.`,
                  skillId,
                  difficulty: "beginner"
                },
                {
                  id: 1008,
                  question: `When facing a roadblock while applying ${skillName}, what's most effective?`,
                  options: [
                    { id: "a", text: "Immediately asking others for solutions" },
                    { id: "b", text: "Giving up and trying a completely different approach" },
                    { id: "c", text: "Systematic troubleshooting and analysis" },
                    { id: "d", text: "Taking a long break from the problem" }
                  ],
                  correctAnswer: "c",
                  explanation: `Methodical troubleshooting is the most effective approach to overcoming challenges in ${skillName}.`,
                  skillId,
                  difficulty: "advanced"
                },
                {
                  id: 1009,
                  question: `How does ${skillName} typically evolve over a professional's career?`,
                  options: [
                    { id: "a", text: "It becomes less important as other skills develop" },
                    { id: "b", text: "It becomes more specialized and nuanced" },
                    { id: "c", text: "It stays exactly the same over time" },
                    { id: "d", text: "It's only relevant during the early career stages" }
                  ],
                  correctAnswer: "b",
                  explanation: `As professionals progress, their application of ${skillName} typically becomes more specialized and nuanced.`,
                  skillId,
                  difficulty: "advanced"
                },
                {
                  id: 1010,
                  question: `What's the relationship between ${skillName} and other professional capabilities?`,
                  options: [
                    { id: "a", text: "They compete for importance in professional settings" },
                    { id: "b", text: "They function independently with no overlap" },
                    { id: "c", text: "They complement each other in an integrated skill set" },
                    { id: "d", text: `${skillName} is the only skill that truly matters` }
                  ],
                  correctAnswer: "c",
                  explanation: `${skillName} works in concert with other professional capabilities to form an integrated skill set.`,
                  skillId,
                  difficulty: "intermediate"
                }
              ]
            };
          }
          
          res.json(assessmentData);
        } catch (error) {
          console.error("Error generating assessment:", error);
          return res.status(500).json({ message: "Failed to generate assessment" });
        }
      } catch (error) {
        next(error);
      }
    }
  );
  
  // ===========================
  // Role-Based Practice Content
  // ===========================
  
  app.get(
    "/api/practice/role/:roleId",
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = req.params.roleId;
        const userId = (req.user as any).id;
        
        // Get the target role
        let targetRole;
        try {
          const roles = await storage.getRoles();
          
          // Matching role ID as string for consistency
          targetRole = roles.find((r: any) => r.id.toString() === roleId.toString());
          
          console.log(`[DEBUG] Practice endpoint - looking for role ID ${roleId} (${typeof roleId}), found:`, 
            targetRole ? `"${targetRole.title}" (ID: ${targetRole.id})` : "No matching role");
          
          // If no exact match by ID, try to find by another attribute
          if (!targetRole) {
            // Handle the case where we have skills for a specific role ID but it's not in the roles array
            // Create a mock role for common IDs we know are being used
            if (roleId === "304") {
              targetRole = {
                id: 304,
                title: "Scrum Master",
                requiredSkills: [
                  "Agile Facilitation",
                  "Servant Leadership",
                  "Sprint Planning",
                  "Conflict Resolution",
                  "Continuous Improvement"
                ]
              };
              console.log(`[DEBUG] Created mock role for ID ${roleId}: ${targetRole.title}`);
            } else if (roleId === "198") {
              targetRole = {
                id: 198,
                title: "NLP Engineer",
                requiredSkills: [
                  "Natural Language Processing",
                  "Python",
                  "Deep Learning",
                  "Text Mining",
                  "Linguistic Knowledge",
                  "Large Language Models",
                  "Text Classification",
                  "Sentiment Analysis"
                ]
              };
              console.log(`[DEBUG] Created mock role for ID ${roleId}: ${targetRole.title}`);
            } else if (roleId === "28") {
              targetRole = {
                id: 28,
                title: "Pharmaceutical Sales Representative",
                requiredSkills: [
                  "Medical Knowledge",
                  "Sales Techniques",
                  "Relationship Building",
                  "Product Knowledge",
                  "Communication"
                ]
              };
              console.log(`[DEBUG] Created mock role for ID ${roleId}: ${targetRole.title}`);
            } else if (roleId === "264") {
              targetRole = {
                id: 264,
                title: "Animation Software Developer",
                requiredSkills: [
                  "3D Animation",
                  "JavaScript",
                  "Interactive Design",
                  "Graphics Programming",
                  "UI/UX Design"
                ]
              };
              console.log(`[DEBUG] Created mock role for ID ${roleId}: ${targetRole.title}`);
            } else {
              return res.status(404).json({ message: "Target role not found" });
            }
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          return res.status(500).json({ message: "Failed to fetch role information" });
        }
        
        // Generate role-specific practice content
        try {
          // First check if OpenAI API is available
          let practiceData;
          
          try {
            const response = await openai.chat.completions.create({
              model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
              messages: [
                {
                  role: "system",
                  content: `You are an expert skills assessment system. Generate practice content for the role of ${targetRole.title}.
                  
                  You should create a set of skills relevant to this role, along with assessment questions to test proficiency.
                  Create content that would help someone prepare for this exact role.`
                },
                {
                  role: "user",
                  content: JSON.stringify({
                    role: targetRole.title,
                    requiredSkills: targetRole.requiredSkills || []
                  })
                }
              ],
              response_format: { type: "json_object" }
            });
            
            const openAIResponse = JSON.parse(response.choices[0].message.content);
            practiceData = openAIResponse;
          } catch (error) {
            console.error("OpenAI API error:", error);
            
            // Fall back to predefined role-specific skills and questions
            const roleSkills = targetRole.requiredSkills || [];
            
            // Create practice content using the role's required skills
            practiceData = {
              roleTitle: targetRole.title,
              skills: roleSkills.slice(0, 5).map((skillName: string, index: number) => ({
                id: 1000 + index,
                name: skillName,
                description: `Master the key aspects of ${skillName} for success as a ${targetRole.title}`,
                category: index % 2 === 0 ? "technical" : "analytical",
                proficiency: 0,
                questionCount: 3 + index % 3,
                difficulty: index % 3 === 0 ? "beginner" : index % 3 === 1 ? "intermediate" : "advanced",
                forTargetRole: targetRole.title,
                questions: [
                  {
                    id: (1000 + index) * 10 + 1,
                    question: `What is a key aspect of ${skillName} in the context of ${targetRole.title}?`,
                    options: [
                      { id: "a", text: `Understanding the fundamentals of ${skillName}` },
                      { id: "b", text: `Advanced application of ${skillName} in complex scenarios` },
                      { id: "c", text: `Teaching others about ${skillName}` },
                      { id: "d", text: `None of the above` }
                    ],
                    correctAnswer: "b",
                    explanation: `In the role of ${targetRole.title}, you need to be able to apply ${skillName} in complex, real-world scenarios.`,
                    skillId: 1000 + index,
                    difficulty: "intermediate"
                  },
                  {
                    id: (1000 + index) * 10 + 2,
                    question: `Which of the following best demonstrates proficiency in ${skillName}?`,
                    options: [
                      { id: "a", text: `Being able to define what ${skillName} is` },
                      { id: "b", text: `Having a certification in ${skillName}` },
                      { id: "c", text: `Successfully applying ${skillName} to solve relevant problems` },
                      { id: "d", text: `Reading books about ${skillName}` }
                    ],
                    correctAnswer: "c",
                    explanation: `True proficiency in ${skillName} is demonstrated through the successful application of knowledge to solve real problems in the context of ${targetRole.title}.`,
                    skillId: 1000 + index,
                    difficulty: "beginner"
                  },
                  {
                    id: (1000 + index) * 10 + 3,
                    question: `How does ${skillName} relate to other skills required for a ${targetRole.title}?`,
                    options: [
                      { id: "a", text: "It operates in isolation from other skills" },
                      { id: "b", text: "It is the only skill that matters for this role" },
                      { id: "c", text: `It complements other skills to create a comprehensive skill set` },
                      { id: "d", text: "It's less important than other skills" }
                    ],
                    correctAnswer: "c",
                    explanation: `In the role of ${targetRole.title}, ${skillName} works together with other skills to form a comprehensive professional skill set.`,
                    skillId: 1000 + index,
                    difficulty: "advanced"
                  }
                ]
              }))
            };
          }
          
          res.json(practiceData);
        } catch (error) {
          console.error("Error generating practice content:", error);
          return res.status(500).json({ message: "Failed to generate practice content" });
        }
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

        // Get the latest career goal directly from the database
        const primaryCareerGoal = await storage.getLatestCareerGoalByUserId(userId);
        console.log("[DEBUG] Dashboard API - Latest career goal:", 
          primaryCareerGoal ? { id: primaryCareerGoal.id, title: primaryCareerGoal.title } : "No career goal found"
        );

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
          // The key skills the user should focus on based on their target role
          keySkills: await (async () => {
            // If the user has a career goal with a target role, fetch those skills instead
            if (primaryCareerGoal && primaryCareerGoal.targetRoleId) {
              // Debug career goal and target role ID
              console.log("[DEBUG] Career goal with targetRoleId:", {
                goalId: primaryCareerGoal.id,
                title: primaryCareerGoal.title,
                targetRoleId: primaryCareerGoal.targetRoleId,
                targetRoleIdType: typeof primaryCareerGoal.targetRoleId
              });
              
              try {
                // Get the target role
                const targetRole = await storage.getInterviewRole(primaryCareerGoal.targetRoleId);
                // Debug target role
                console.log("[DEBUG] Target role:", targetRole ? {
                  id: targetRole.id,
                  title: targetRole.title,
                  requiredSkills: targetRole.requiredSkills,
                  hasSkills: Array.isArray(targetRole.requiredSkills)
                } : 'Not found');
                
                if (targetRole && Array.isArray(targetRole.requiredSkills) && targetRole.requiredSkills.length > 0) {
                  console.log("[DEBUG] Processing target role skills for keySkills");
                  
                  // Map the current user skills to a lookup object
                  const userSkillsMap = new Map(
                    userSkills.map(skill => [skill.skillName.toLowerCase(), skill])
                  );
                  
                  // For each target skill, check if user has it
                  const targetSkills = targetRole.requiredSkills
                    .filter(skill => skill && typeof skill === 'string')
                    .map(skillName => {
                      const userSkill = userSkillsMap.get(skillName.toLowerCase());
                      let status: 'missing' | 'improvement' | 'proficient' = 'missing';
                      let currentLevel = 30; // Default baseline for missing skills
                      
                      if (userSkill) {
                        currentLevel = userSkill.currentLevel;
                        if (currentLevel >= 80) {
                          status = 'proficient';
                        } else {
                          status = 'improvement';
                        }
                      }
                      
                      // For target role skills, we want a high proficiency level
                      const targetLevel = 90;
                      
                      return {
                        name: skillName,
                        status,
                        currentLevel,
                        targetLevel,
                        percentage: Math.round((currentLevel / targetLevel) * 100)
                      };
                    })
                    .sort((a, b) => {
                      // Sort: missing first, then need improvement, then proficient
                      if (a.status === 'missing' && b.status !== 'missing') return -1;
                      if (a.status !== 'missing' && b.status === 'missing') return 1;
                      if (a.status === 'improvement' && b.status === 'proficient') return -1;
                      if (a.status === 'proficient' && b.status === 'improvement') return 1;
                      // Then sort by percentage
                      return a.percentage - b.percentage;
                    })
                    .slice(0, 5); // Top 5 skills to focus on
                  
                  console.log("[DEBUG] Target role skills processed:", targetSkills.map(s => s.name));
                  return targetSkills;
                } else {
                  console.log("[DEBUG] Target role has no skills or is invalid, falling back to user skills");
                }
              } catch (error) {
                console.error("Error fetching target role skills:", error);
              }
            }
            
            console.log("[DEBUG] Using fallback skills (user's current skills with lowest percentages)");
            // Fallback to user's current skills with lowest percentages
            return userSkills
              .map(skill => ({
                name: skill.skillName,
                status: skill.currentLevel < 60 ? 'improvement' : 'proficient',
                currentLevel: skill.currentLevel,
                targetLevel: skill.targetLevel,
                percentage: Math.round((skill.currentLevel / skill.targetLevel) * 100)
              }))
              .sort((a, b) => a.percentage - b.percentage)
              .slice(0, 5);
          })(),
          careerGoal: primaryCareerGoal ? {
            id: primaryCareerGoal.id,
            title: primaryCareerGoal.title,
            timeline: `Target timeline: ${formatTimelineMonths(primaryCareerGoal.timelineMonths)}`,
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

  // Get all interview roles (now including banking and financial services roles)
  app.get(
    "/api/interview/roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get all roles
        const allRoles = await storage.getAllInterviewRoles();
        
        // Get the industry filter from query parameters, if provided
        const industryFilter = req.query.industry as string | undefined;
        
        // Apply filter if industry parameter is provided
        let filteredRoles = allRoles;
        if (industryFilter) {
          filteredRoles = allRoles.filter(role => 
            role.industry.toLowerCase() === industryFilter.toLowerCase()
          );
          console.log(`[INFO] Filtered roles by industry '${industryFilter}': ${allRoles.length} total roles -> ${filteredRoles.length} roles`);
        } else {
          // If no filter provided, prioritize banking roles but include all roles
          filteredRoles = allRoles;
          console.log(`[INFO] Returning all ${allRoles.length} roles`);
        }
        
        res.json(filteredRoles);
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
        
        // Return any valid role regardless of industry
        res.json(role);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // =====================
  // Career Path Routes
  // =====================
  
  // Define the IT industry role titles list as a constant for reuse
  const itRoleTitles = [
    // Software Development & Engineering
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile Application Developer",
    "Software Quality Assurance (QA) Tester",
    "Application Support Engineer",
    "Software Architect",
    "Agile Scrum Master",
    
    // Data & Analytics
    "Data Scientist",
    "Business Intelligence (BI) Developer",
    "Data Engineer",
    "Machine Learning Engineer",
    "Data Visualization Specialist",
    "Big Data Architect",
    "Statistical Analyst",
    "Data Governance Consultant",
    
    // Artificial Intelligence & Machine Learning
    "AI Research Scientist",
    "Natural Language Processing (NLP) Engineer",
    "Computer Vision Developer",
    "Deep Learning Specialist",
    "AI Ethics Consultant",
    "Reinforcement Learning Engineer",
    "AI Model Deployment Engineer",
    "Cognitive Computing Developer",
    
    // Cloud Computing & DevOps
    "Cloud Solutions Architect",
    "DevOps Engineer",
    "Site Reliability Engineer (SRE)",
    "Cloud Infrastructure Administrator",
    "Continuous Integration/Continuous Deployment (CI/CD) Pipeline Developer",
    "Containerization Specialist (Docker/Kubernetes)",
    "Cloud Security Analyst",
    "Platform as a Service (PaaS) Developer",
    
    // Cybersecurity
    "Security Operations Center (SOC) Analyst",
    "Penetration Tester (Ethical Hacker)",
    "Security Information and Event Management (SIEM) Specialist",
    "Identity and Access Management (IAM) Engineer",
    "Cloud Security Architect",
    "Cyber Threat Intelligence Analyst",
    "Incident Response Coordinator",
    "Compliance and Risk Management IT Consultant",
    
    // IT Support & Administration
    "IT Support Specialist",
    "Help Desk Technician",
    "System Administrator",
    "Network Administrator",
    "IT Asset Manager",
    "Technical Support Engineer",
    "Desktop Support Analyst",
    "IT Operations Manager",
    
    // Project & Product Management
    "IT Project Manager",
    "Technical Program Manager",
    "Product Owner",
    "Business Analyst",
    "Scrum Master",
    "Agile Coach",
    "IT Portfolio Manager",
    "Change Management Consultant"
  ];

  // Get all career paths
  app.get(
    "/api/career/paths",
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        // Get all career paths
        const allPaths = await storage.getAllCareerPaths();
        
        // Filter to only include paths for IT industry roles
        const filteredPaths = [];
        
        for (const path of allPaths) {
          // Get the role for this path
          const role = await storage.getInterviewRole(path.roleId);
          
          // If the role exists and is in the IT roles list, include the path
          if (role && itRoleTitles.includes(role.title)) {
            filteredPaths.push({
              ...path,
              roleName: role.title // Add the role name for convenience
            });
          }
        }
        
        console.log(`[INFO] Filtered career paths: ${allPaths.length} total paths -> ${filteredPaths.length} IT industry paths`);
        res.json(filteredPaths);
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
        
        // Get the role to check if it's an IT industry role
        const role = await storage.getInterviewRole(roleId);
        
        // If role doesn't exist or is not an IT industry role, return 404
        if (!role || !itRoleTitles.includes(role.title)) {
          console.log(`[WARN] Career path requested for non-IT role ID: ${roleId}, role: ${role?.title || 'not found'}`);
          return res.status(404).json({ message: "Career path not found for this role or role is not in the IT industry" });
        }
        
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
  
  // NOTE: This endpoint is redundant and should be consolidated. It's an older duplicate of the endpoint above.
  // Get career path by role ID
  app.get(
    "/api/career/paths/role/:roleId",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const roleId = parseInt(req.params.roleId);
        
        // Get the role to check if it's an IT industry role
        const role = await storage.getInterviewRole(roleId);
        
        // If role doesn't exist or is not an IT industry role, return 404
        if (!role || !itRoleTitles.includes(role.title)) {
          console.log(`[WARN] Career path requested for non-IT role ID: ${roleId}, role: ${role?.title || 'not found'}`);
          return res.status(404).json({ message: "Career path not found for this role or role is not in the IT industry" });
        }
        
        const path = await storage.getCareerPathByRoleId(roleId);
        
        if (!path) {
          return res.status(404).json({ message: "Career path not found for this role" });
        }
        
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

        // Check if a role with the same title already exists
        const existingRole = await storage.getInterviewRoleByTitle(roleDataResult.data.title);
        
        if (existingRole) {
          // Update the existing role
          const updatedRole = await storage.updateInterviewRole(existingRole.id, roleDataResult.data);
          res.status(200).json(updatedRole);
        } else {
          // Create a new role
          const newRole = await storage.createInterviewRole(roleDataResult.data);
          res.status(201).json(newRole);
        }
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
        // Log what we're doing
        console.log("Updating technology industry roles...");
        
        let addedCount = 0;
        
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
        
        // Use the upsert pattern for each role
        const createdRoles = [];
        let updatedCount = 0;
        let newCount = 0;
        
        for (const role of updatedTechRoles) {
          // Check if role with this title already exists
          const existingRole = await storage.getInterviewRoleByTitle(role.title);
          
          if (existingRole) {
            // Update existing role
            const updatedRole = await storage.updateInterviewRole(existingRole.id, role);
            if (updatedRole) {
              createdRoles.push(updatedRole);
              updatedCount++;
              console.log(`Updated role: ${role.title}`);
            }
          } else {
            // Create new role
            const newRole = await storage.createInterviewRole(role);
            createdRoles.push(newRole);
            newCount++;
            console.log(`Created new role: ${role.title}`);
          }
        }
        
        res.status(200).json({
          message: "Technology industry roles updated successfully",
          newRoles: newCount,
          updatedRoles: updatedCount,
          count: createdRoles.length,
          roles: createdRoles
        });
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Update other industry roles
  app.post(
    "/api/interview/update-other-industry-roles",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get list of industries to update
        const industries = [
          "marketing", 
          "finance", 
          "healthcare", 
          "education", 
          "human_resources", 
          "operations", 
          "logistics", 
          "business", 
          "banking", 
          "construction", 
          "consulting", 
          "pharmaceutical"
        ];
        
        let totalDeleted = 0;
        let totalCreated = 0;
        
        // We'll use upsert pattern - no need to delete existing roles
        for (const industry of industries) {
          // Get existing industry roles for reporting purposes
          const existingRoles = await storage.getInterviewRolesByIndustry(industry);
          console.log(`Found ${existingRoles.length} existing ${industry} industry roles`);
          
          // Log the existing role titles for debugging
          if (existingRoles.length > 0) {
            console.log(`Existing ${industry} role titles:`, existingRoles.map(r => r.title));
          }
        }
        
        console.log("Adding new roles for various industries...");
        
        // Marketing industry roles
        const marketingRoles = [
          {
            title: "Digital Marketing Specialist",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Plans and executes digital marketing campaigns across multiple channels",
            requiredSkills: ["SEO/SEM", "Social Media Marketing", "Content Marketing", "Email Marketing", "Analytics", "PPC Advertising", "Digital Strategy", "Marketing Automation"],
            averageSalary: "75000",
            growthRate: "16.5",
            demandScore: 8
          },
          {
            title: "SEO/SEM Specialist",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Optimizes websites and campaigns for search engines and manages search marketing",
            requiredSkills: ["SEO", "SEM", "Google Analytics", "Keyword Research", "Content Optimization", "Google Ads", "Technical SEO", "Competitive Analysis"],
            averageSalary: "72000",
            growthRate: "15.8",
            demandScore: 8
          },
          {
            title: "Content Strategist",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Develops and manages content plans to meet business and audience needs",
            requiredSkills: ["Content Planning", "Editorial Calendar", "Audience Research", "Content Analytics", "Content Marketing", "Brand Voice", "SEO", "Storytelling"],
            averageSalary: "80000",
            growthRate: "14.2",
            demandScore: 7
          },
          {
            title: "Growth Marketer",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Uses data-driven strategies to drive user acquisition, retention, and revenue growth",
            requiredSkills: ["Acquisition Channels", "Conversion Optimization", "A/B Testing", "User Analytics", "Funnel Analysis", "Retention Strategies", "Marketing Automation", "Experimentation"],
            averageSalary: "95000",
            growthRate: "18.7",
            demandScore: 9
          },
          {
            title: "Marketing Automation Specialist",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Implements and manages automated marketing campaigns and workflows",
            requiredSkills: ["Marketing Automation Platforms", "Email Marketing", "Customer Journeys", "Segmentation", "Lead Scoring", "Campaign Analytics", "CRM Integration", "Workflow Design"],
            averageSalary: "78000",
            growthRate: "17.3",
            demandScore: 8
          },
          {
            title: "Social Media Manager",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Develops and implements social media strategies across multiple platforms",
            requiredSkills: ["Social Media Platforms", "Content Creation", "Community Management", "Social Analytics", "Paid Social", "Social Strategy", "Brand Voice", "Social Listening"],
            averageSalary: "65000",
            growthRate: "13.5",
            demandScore: 7
          },
          {
            title: "Brand Manager",
            industry: "marketing",
            level: "senior",
            roleType: "marketing",
            description: "Oversees and develops brand strategy, positioning, and identity",
            requiredSkills: ["Brand Strategy", "Market Research", "Brand Guidelines", "Product Positioning", "Consumer Insights", "Brand Analytics", "Campaign Management", "Competitor Analysis"],
            averageSalary: "105000",
            growthRate: "12.8",
            demandScore: 8
          },
          {
            title: "Product Marketing Manager",
            industry: "marketing",
            level: "senior",
            roleType: "marketing",
            description: "Develops go-to-market strategies and positions products to target audiences",
            requiredSkills: ["Product Positioning", "Competitive Analysis", "Market Research", "Sales Enablement", "Customer Personas", "Product Launches", "Messaging", "Value Proposition"],
            averageSalary: "110000",
            growthRate: "16.2",
            demandScore: 8
          },
          {
            title: "Performance Marketing Analyst",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Analyzes and optimizes marketing campaigns for maximum ROI",
            requiredSkills: ["Marketing Analytics", "Campaign Optimization", "PPC", "Paid Social", "Attribution Modeling", "A/B Testing", "Data Visualization", "ROI Analysis"],
            averageSalary: "75000",
            growthRate: "15.5",
            demandScore: 8
          },
          {
            title: "Influencer Marketing Manager",
            industry: "marketing",
            level: "mid",
            roleType: "marketing",
            description: "Develops and manages influencer relationships and campaigns",
            requiredSkills: ["Influencer Relationships", "Campaign Management", "Social Media Platforms", "Content Creation", "ROI Measurement", "Influencer Selection", "Contract Negotiation", "Brand Alignment"],
            averageSalary: "70000",
            growthRate: "13.9",
            demandScore: 7
          }
        ];
        
        // Finance industry roles
        const financeRoles = [
          {
            title: "Financial Analyst",
            industry: "finance",
            level: "mid",
            roleType: "finance",
            description: "Analyzes financial data to provide insights for business decisions",
            requiredSkills: ["Financial Modeling", "Excel", "Data Analysis", "Financial Reporting", "Budgeting", "Forecasting", "Variance Analysis", "Accounting Principles"],
            averageSalary: "85000",
            growthRate: "10.8",
            demandScore: 8
          },
          {
            title: "Investment Banker",
            industry: "finance",
            level: "senior",
            roleType: "finance",
            description: "Facilitates raising capital and provides financial advisory services",
            requiredSkills: ["Financial Modeling", "Valuation", "M&A", "Capital Markets", "Deal Structuring", "Financial Analysis", "Client Management", "Presentation Skills"],
            averageSalary: "150000",
            growthRate: "9.4",
            demandScore: 7
          },
          {
            title: "Risk Analyst",
            industry: "finance",
            level: "mid",
            roleType: "finance",
            description: "Identifies and analyzes potential risks to organizational operations",
            requiredSkills: ["Risk Assessment", "Regulatory Compliance", "Data Analysis", "Risk Modeling", "Financial Markets", "Statistical Analysis", "Risk Controls", "Stress Testing"],
            averageSalary: "92000",
            growthRate: "13.2",
            demandScore: 8
          },
          {
            title: "Credit Analyst",
            industry: "finance",
            level: "mid",
            roleType: "finance",
            description: "Evaluates creditworthiness of individuals or organizations",
            requiredSkills: ["Credit Assessment", "Financial Statement Analysis", "Risk Evaluation", "Loan Documentation", "Regulatory Compliance", "Financial Modeling", "Industry Research", "Decision Making"],
            averageSalary: "75000",
            growthRate: "8.5",
            demandScore: 7
          },
          {
            title: "Financial Planner",
            industry: "finance",
            level: "mid",
            roleType: "finance",
            description: "Helps individuals and families develop financial strategies",
            requiredSkills: ["Financial Planning", "Investment Management", "Retirement Planning", "Tax Planning", "Estate Planning", "Client Relationship Management", "Regulatory Compliance", "Risk Assessment"],
            averageSalary: "88000",
            growthRate: "11.3",
            demandScore: 7
          },
          {
            title: "Portfolio Manager",
            industry: "finance",
            level: "senior",
            roleType: "finance",
            description: "Manages investment portfolios to meet specific client objectives",
            requiredSkills: ["Investment Management", "Asset Allocation", "Financial Analysis", "Market Research", "Performance Measurement", "Risk Management", "Client Relationship", "Strategic Planning"],
            averageSalary: "130000",
            growthRate: "10.2",
            demandScore: 8
          },
          {
            title: "Treasury Analyst",
            industry: "finance",
            level: "mid",
            roleType: "finance",
            description: "Manages an organization's cash flow and financial risk",
            requiredSkills: ["Cash Management", "Foreign Exchange", "Cash Forecasting", "Liquidity Management", "Banking Relationships", "Risk Management", "Financial Analysis", "Treasury Systems"],
            averageSalary: "82000",
            growthRate: "9.8",
            demandScore: 7
          },
          {
            title: "Quantitative Analyst",
            industry: "finance",
            level: "senior",
            roleType: "finance",
            description: "Applies mathematical and statistical methods to financial problems",
            requiredSkills: ["Quantitative Analysis", "Financial Modeling", "Programming (Python/R)", "Statistics", "Derivatives Pricing", "Risk Management", "Machine Learning", "Data Analysis"],
            averageSalary: "125000",
            growthRate: "14.8",
            demandScore: 8
          },
          {
            title: "Fintech Product Manager",
            industry: "finance",
            level: "senior",
            roleType: "finance",
            description: "Develops and manages financial technology products",
            requiredSkills: ["Product Management", "Financial Services", "User Experience", "Agile Methodologies", "Financial Regulations", "API Integration", "Market Research", "Product Strategy"],
            averageSalary: "115000",
            growthRate: "15.2",
            demandScore: 8
          },
          {
            title: "Fraud Detection Specialist",
            industry: "finance",
            level: "mid",
            roleType: "finance",
            description: "Identifies and investigates fraudulent financial activities",
            requiredSkills: ["Fraud Analytics", "Investigative Techniques", "Risk Assessment", "Data Analysis", "AML Knowledge", "Transaction Monitoring", "Regulatory Compliance", "Pattern Recognition"],
            averageSalary: "85000",
            growthRate: "16.5",
            demandScore: 8
          }
        ];
        
        // Healthcare industry roles
        const healthcareRoles = [
          {
            title: "Clinical Research Associate",
            industry: "healthcare",
            level: "mid",
            roleType: "healthcare",
            description: "Monitors clinical trials to ensure compliance with protocols and regulations",
            requiredSkills: ["Clinical Trial Procedures", "ICH-GCP", "Regulatory Compliance", "Trial Documentation", "Site Monitoring", "Data Verification", "Medical Terminology", "Quality Assurance"],
            averageSalary: "85000",
            growthRate: "12.8",
            demandScore: 7
          },
          {
            title: "Health Informatics Specialist",
            industry: "healthcare",
            level: "mid",
            roleType: "healthcare",
            description: "Designs and manages health information systems and technology",
            requiredSkills: ["Health Information Systems", "EHR/EMR Systems", "Data Analytics", "Healthcare IT", "HL7", "Healthcare Workflows", "System Integration", "Clinical Terminology"],
            averageSalary: "92000",
            growthRate: "17.5",
            demandScore: 8
          },
          {
            title: "Healthcare Data Analyst",
            industry: "healthcare",
            level: "mid",
            roleType: "healthcare",
            description: "Analyzes healthcare data to improve patient outcomes and operational efficiency",
            requiredSkills: ["Healthcare Analytics", "Statistical Analysis", "Data Visualization", "SQL", "Medical Terminology", "Healthcare Systems", "Quality Metrics", "Population Health"],
            averageSalary: "88000",
            growthRate: "18.2",
            demandScore: 8
          },
          {
            title: "Public Health Analyst",
            industry: "healthcare",
            level: "mid",
            roleType: "healthcare",
            description: "Analyzes health trends and develops public health programs",
            requiredSkills: ["Epidemiology", "Public Health Programs", "Data Analysis", "Research Methods", "Health Education", "Program Evaluation", "Community Assessment", "Health Policy"],
            averageSalary: "82000",
            growthRate: "14.5",
            demandScore: 7
          },
          {
            title: "Medical Coder",
            industry: "healthcare",
            level: "entry",
            roleType: "healthcare",
            description: "Assigns standardized codes to medical diagnoses and procedures",
            requiredSkills: ["ICD-10 Coding", "CPT Coding", "Medical Terminology", "Anatomy & Physiology", "Healthcare Compliance", "Medical Documentation", "Attention to Detail", "Healthcare Regulations"],
            averageSalary: "55000",
            growthRate: "10.6",
            demandScore: 7
          },
          {
            title: "Biomedical Engineer",
            industry: "healthcare",
            level: "senior",
            roleType: "healthcare",
            description: "Develops medical devices and equipment to improve patient care",
            requiredSkills: ["Medical Device Design", "Biomedical Instrumentation", "Clinical Evaluation", "Regulatory Compliance", "Quality Assurance", "Product Development", "CAD Software", "Biology & Physiology"],
            averageSalary: "98000",
            growthRate: "6.5",
            demandScore: 7
          },
          {
            title: "Patient Experience Manager",
            industry: "healthcare",
            level: "mid",
            roleType: "healthcare",
            description: "Develops strategies to improve patient satisfaction and engagement",
            requiredSkills: ["Patient Experience", "Healthcare Administration", "Customer Service", "Program Development", "Quality Improvement", "Data Analysis", "Patient Advocacy", "Healthcare Regulations"],
            averageSalary: "78000",
            growthRate: "11.8",
            demandScore: 7
          },
          {
            title: "Medical Software Developer",
            industry: "healthcare",
            level: "mid",
            roleType: "healthcare",
            description: "Develops software applications for healthcare settings",
            requiredSkills: ["Programming", "Healthcare IT", "Electronic Health Records", "HIPAA Compliance", "User Interface Design", "System Integration", "Medical Terminology", "Software Testing"],
            averageSalary: "105000",
            growthRate: "16.4",
            demandScore: 8
          },
          {
            title: "Health Data Privacy Officer",
            industry: "healthcare",
            level: "senior",
            roleType: "healthcare",
            description: "Ensures compliance with health data privacy regulations",
            requiredSkills: ["HIPAA Compliance", "Healthcare Regulations", "Data Privacy", "Security Policies", "Risk Assessment", "Compliance Training", "Audit Procedures", "Healthcare IT"],
            averageSalary: "110000",
            growthRate: "15.7",
            demandScore: 8
          }
        ];
        
        // Education industry roles
        const educationRoles = [
          {
            title: "Instructional Designer",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Develops effective educational content and learning experiences",
            requiredSkills: ["Instructional Design Models", "E-Learning Development", "Learning Assessment", "Curriculum Design", "Educational Technology", "Multimedia Creation", "Adult Learning Theory", "Content Authoring Tools"],
            averageSalary: "75000",
            growthRate: "13.5",
            demandScore: 7
          },
          {
            title: "Educational Technologist",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Implements and manages technology solutions for educational settings",
            requiredSkills: ["Educational Technology", "Digital Learning Tools", "Technology Integration", "Learning Management Systems", "Training & Support", "Educational Assessment", "Project Management", "Instructional Design"],
            averageSalary: "78000",
            growthRate: "14.8",
            demandScore: 7
          },
          {
            title: "Curriculum Developer",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Creates educational programs and instructional materials",
            requiredSkills: ["Curriculum Design", "Learning Objectives", "Content Development", "Educational Standards", "Assessment Creation", "Instructional Strategies", "Subject Matter Expertise", "Curriculum Mapping"],
            averageSalary: "72000",
            growthRate: "11.2",
            demandScore: 7
          },
          {
            title: "Online Learning Specialist",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Designs and manages virtual learning environments and courses",
            requiredSkills: ["Online Course Design", "LMS Administration", "Virtual Classroom Tools", "Digital Assessment", "E-Learning Development", "Student Engagement", "Multimedia Creation", "Online Pedagogies"],
            averageSalary: "70000",
            growthRate: "15.5",
            demandScore: 8
          },
          {
            title: "EdTech Software Developer",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Develops educational software applications and platforms",
            requiredSkills: ["Software Development", "Educational Technology", "User Experience Design", "Learning Analytics", "API Integration", "Mobile Development", "Gamification", "Educational Standards"],
            averageSalary: "95000",
            growthRate: "16.8",
            demandScore: 8
          },
          {
            title: "Academic Advisor",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Guides students in academic planning and educational decisions",
            requiredSkills: ["Academic Counseling", "Education Policy", "Student Development", "Course Planning", "Career Guidance", "Student Assessment", "Communication Skills", "Educational Technologies"],
            averageSalary: "55000",
            growthRate: "10.2",
            demandScore: 6
          },
          {
            title: "LMS Administrator",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Manages and supports learning management systems",
            requiredSkills: ["LMS Configuration", "User Management", "Course Setup", "System Integration", "Technical Support", "Training Development", "Data Management", "Troubleshooting"],
            averageSalary: "68000",
            growthRate: "13.5",
            demandScore: 7
          },
          {
            title: "Education Data Analyst",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Analyzes educational data to improve learning outcomes",
            requiredSkills: ["Data Analysis", "Learning Analytics", "Educational Assessment", "Statistical Methods", "Data Visualization", "Student Performance Metrics", "Education Research", "Reporting"],
            averageSalary: "72000",
            growthRate: "15.2",
            demandScore: 7
          },
          {
            title: "Student Success Specialist",
            industry: "education",
            level: "mid",
            roleType: "education",
            description: "Develops and implements programs to support student achievement",
            requiredSkills: ["Student Support Services", "Intervention Strategies", "Academic Coaching", "Retention Programs", "Data Analysis", "Student Engagement", "Educational Assessment", "Program Development"],
            averageSalary: "58000",
            growthRate: "12.5",
            demandScore: 7
          }
        ];
        
        // Human Resources roles
        const hrRoles = [
          {
            title: "HR Business Partner",
            industry: "human_resources",
            level: "senior",
            roleType: "human_resources",
            description: "Aligns HR strategies with business objectives and supports organizational leaders",
            requiredSkills: ["Strategic Partnership", "Employee Relations", "Organization Development", "Change Management", "Talent Management", "HR Policies", "Performance Management", "Business Acumen"],
            averageSalary: "95000",
            growthRate: "10.8",
            demandScore: 8
          },
          {
            title: "Talent Acquisition Specialist",
            industry: "human_resources",
            level: "mid",
            roleType: "human_resources",
            description: "Sources, attracts, and hires qualified candidates for organizational roles",
            requiredSkills: ["Recruitment Strategies", "Candidate Sourcing", "Interviewing", "ATS Systems", "Employer Branding", "Job Market Research", "Talent Pipeline", "Candidate Assessment"],
            averageSalary: "70000",
            growthRate: "13.5",
            demandScore: 8
          },
          {
            title: "HR Data Analyst",
            industry: "human_resources",
            level: "mid",
            roleType: "human_resources",
            description: "Analyzes HR metrics to provide insights for workforce decisions",
            requiredSkills: ["People Analytics", "HR Metrics", "Statistical Analysis", "Data Visualization", "HRIS Systems", "Workforce Planning", "Reporting", "Survey Design"],
            averageSalary: "82000",
            growthRate: "16.8",
            demandScore: 8
          },
          {
            title: "Learning and Development Manager",
            industry: "human_resources",
            level: "senior",
            roleType: "human_resources",
            description: "Develops and manages employee training and development programs",
            requiredSkills: ["Training Program Design", "Adult Learning Theory", "Needs Assessment", "Learning Management Systems", "Training Facilitation", "Program Evaluation", "Instructional Design", "Leadership Development"],
            averageSalary: "88000",
            growthRate: "11.5",
            demandScore: 7
          },
          {
            title: "Compensation and Benefits Analyst",
            industry: "human_resources",
            level: "mid",
            roleType: "human_resources",
            description: "Designs and administers employee compensation and benefits programs",
            requiredSkills: ["Compensation Analysis", "Benefits Administration", "Market Research", "Salary Benchmarking", "Job Evaluation", "HRIS Systems", "Compliance", "Program Design"],
            averageSalary: "75000",
            growthRate: "9.8",
            demandScore: 7
          },
          {
            title: "DEI Specialist",
            industry: "human_resources",
            level: "mid",
            roleType: "human_resources",
            description: "Develops and implements diversity, equity, and inclusion initiatives",
            requiredSkills: ["DEI Strategy", "Program Development", "Cultural Competence", "Training Design", "Inclusion Metrics", "Employee Resource Groups", "Workforce Analytics", "Change Management"],
            averageSalary: "78000",
            growthRate: "15.4",
            demandScore: 8
          },
          {
            title: "Employee Experience Manager",
            industry: "human_resources",
            level: "mid",
            roleType: "human_resources",
            description: "Creates and implements strategies to improve employee engagement and satisfaction",
            requiredSkills: ["Employee Engagement", "Organizational Culture", "Program Development", "Onboarding Process", "Pulse Surveys", "Employee Lifecycle", "Change Management", "Employee Recognition"],
            averageSalary: "82000",
            growthRate: "12.7",
            demandScore: 7
          },
          {
            title: "HR Technology Specialist",
            industry: "human_resources",
            level: "mid",
            roleType: "human_resources",
            description: "Implements and manages HR information systems and technology",
            requiredSkills: ["HRIS Systems", "System Implementation", "HR Process Automation", "User Training", "System Integration", "Data Management", "Project Management", "Technical Support"],
            averageSalary: "85000",
            growthRate: "14.2",
            demandScore: 8
          }
        ];
        
        // Operations roles
        const operationsRoles = [
          {
            title: "Operations Manager",
            industry: "operations",
            level: "senior",
            roleType: "operations",
            description: "Oversees daily operations to ensure efficiency and effectiveness",
            requiredSkills: ["Operational Planning", "Process Management", "Team Leadership", "Performance Metrics", "Budget Management", "Resource Allocation", "Risk Management", "Quality Control"],
            averageSalary: "95000",
            growthRate: "11.2",
            demandScore: 8
          },
          {
            title: "Supply Chain Analyst",
            industry: "operations",
            level: "mid",
            roleType: "operations",
            description: "Analyzes and optimizes supply chain processes and performance",
            requiredSkills: ["Supply Chain Management", "Data Analysis", "Inventory Management", "Demand Planning", "Logistics", "Cost Analysis", "Process Improvement", "ERP Systems"],
            averageSalary: "78000",
            growthRate: "13.6",
            demandScore: 8
          },
          {
            title: "Process Improvement Specialist",
            industry: "operations",
            level: "mid",
            roleType: "operations",
            description: "Identifies and implements process optimizations and efficiencies",
            requiredSkills: ["Lean Six Sigma", "Process Mapping", "Data Analysis", "Continuous Improvement", "Change Management", "DMAIC Methodology", "Project Management", "Problem Solving"],
            averageSalary: "85000",
            growthRate: "12.8",
            demandScore: 8
          },
          {
            title: "Business Operations Analyst",
            industry: "operations",
            level: "mid",
            roleType: "operations",
            description: "Analyzes business operations to identify improvements and efficiencies",
            requiredSkills: ["Operational Analysis", "Data Analysis", "Process Documentation", "KPI Development", "Business Requirements", "Project Management", "Cross-functional Collaboration", "Systems Thinking"],
            averageSalary: "80000",
            growthRate: "14.2",
            demandScore: 8
          },
          {
            title: "Operations Research Scientist",
            industry: "operations",
            level: "senior",
            roleType: "operations",
            description: "Applies analytical methods to solve complex operational problems",
            requiredSkills: ["Mathematical Modeling", "Statistical Analysis", "Optimization", "Simulation", "Decision Analysis", "Programming", "Data Science", "Problem Solving"],
            averageSalary: "105000",
            growthRate: "16.5",
            demandScore: 8
          },
          {
            title: "Vendor Manager",
            industry: "operations",
            level: "mid",
            roleType: "operations",
            description: "Manages vendor relationships, contracts, and performance",
            requiredSkills: ["Vendor Management", "Contract Negotiation", "Performance Metrics", "Relationship Management", "Cost Analysis", "Risk Assessment", "Procurement Processes", "Strategic Sourcing"],
            averageSalary: "82000",
            growthRate: "10.5",
            demandScore: 7
          },
          {
            title: "Plant Manager",
            industry: "operations",
            level: "senior",
            roleType: "operations",
            description: "Oversees manufacturing operations at a production facility",
            requiredSkills: ["Manufacturing Operations", "Production Planning", "Lean Manufacturing", "Team Leadership", "Quality Control", "Regulatory Compliance", "Budget Management", "Continuous Improvement"],
            averageSalary: "110000",
            growthRate: "8.5",
            demandScore: 7
          }
        ];
        
        // Logistics roles
        const logisticsRoles = [
          {
            title: "Logistics Coordinator",
            industry: "logistics",
            level: "mid",
            roleType: "operations",
            description: "Coordinates the movement and storage of goods and materials",
            requiredSkills: ["Logistics Management", "Transportation Planning", "Inventory Control", "Shipping Documentation", "Supply Chain Knowledge", "Carrier Management", "Problem Solving", "Communication"],
            averageSalary: "65000",
            growthRate: "12.8",
            demandScore: 7
          },
          {
            title: "Transportation Manager",
            industry: "logistics",
            level: "senior",
            roleType: "operations",
            description: "Manages transportation operations, carriers, and freight movements",
            requiredSkills: ["Transportation Management", "Carrier Relations", "Route Optimization", "Freight Cost Analysis", "Regulatory Compliance", "Team Leadership", "Performance Metrics", "Contract Negotiation"],
            averageSalary: "95000",
            growthRate: "10.5",
            demandScore: 7
          },
          {
            title: "Fleet Manager",
            industry: "logistics",
            level: "mid",
            roleType: "operations",
            description: "Oversees the operation and maintenance of vehicle fleets",
            requiredSkills: ["Fleet Management", "Vehicle Maintenance", "Driver Management", "Cost Control", "Compliance", "Safety Programs", "Vendor Management", "Route Planning"],
            averageSalary: "78000",
            growthRate: "9.8",
            demandScore: 7
          },
          {
            title: "Inventory Analyst",
            industry: "logistics",
            level: "mid",
            roleType: "operations",
            description: "Monitors and optimizes inventory levels and processes",
            requiredSkills: ["Inventory Management", "Demand Forecasting", "Data Analysis", "Inventory Control Systems", "Supply Chain Knowledge", "ABC Analysis", "Cycle Counting", "Process Improvement"],
            averageSalary: "72000",
            growthRate: "11.5",
            demandScore: 7
          },
          {
            title: "Warehouse Operations Manager",
            industry: "logistics",
            level: "senior",
            roleType: "operations",
            description: "Manages warehouse facilities, staff, and operations",
            requiredSkills: ["Warehouse Management", "Inventory Control", "Team Leadership", "Process Improvement", "Safety Protocols", "WMS Systems", "Performance Metrics", "Budget Management"],
            averageSalary: "85000",
            growthRate: "10.2",
            demandScore: 7
          },
          {
            title: "Freight Broker",
            industry: "logistics",
            level: "mid",
            roleType: "operations",
            description: "Connects shippers with carriers and negotiates transportation services",
            requiredSkills: ["Freight Brokering", "Carrier Management", "Rate Negotiation", "Customer Service", "Transportation Management", "Load Planning", "Market Knowledge", "Relationship Building"],
            averageSalary: "70000",
            growthRate: "13.8",
            demandScore: 7
          },
          {
            title: "Supply Chain Solutions Engineer",
            industry: "logistics",
            level: "senior",
            roleType: "operations",
            description: "Designs and implements supply chain and logistics solutions",
            requiredSkills: ["Supply Chain Design", "Network Optimization", "Process Engineering", "Analytics", "Project Management", "Simulation Modeling", "Transportation Systems", "Logistics Technology"],
            averageSalary: "98000",
            growthRate: "14.5",
            demandScore: 8
          },
          {
            title: "Reverse Logistics Specialist",
            industry: "logistics",
            level: "mid",
            roleType: "operations",
            description: "Manages the process of product returns and disposal",
            requiredSkills: ["Reverse Logistics", "Returns Processing", "Refurbishment", "Disposal Operations", "Process Optimization", "Inventory Management", "Sustainability", "Compliance"],
            averageSalary: "72000",
            growthRate: "11.2",
            demandScore: 7
          }
        ];
        
        // Business roles
        const businessRoles = [
          {
            title: "Business Analyst",
            industry: "business",
            level: "mid",
            roleType: "business",
            description: "Analyzes business processes and requirements to recommend improvements",
            requiredSkills: ["Requirements Analysis", "Process Mapping", "Data Analysis", "Business Documentation", "Stakeholder Management", "System Design", "Project Management", "Problem Solving"],
            averageSalary: "85000",
            growthRate: "14.5",
            demandScore: 8
          },
          {
            title: "Business Development Manager",
            industry: "business",
            level: "senior",
            roleType: "business",
            description: "Identifies growth opportunities and builds strategic partnerships",
            requiredSkills: ["Strategic Planning", "Market Analysis", "Relationship Building", "Sales", "Contract Negotiation", "Business Strategy", "Industry Knowledge", "Value Proposition Development"],
            averageSalary: "105000",
            growthRate: "12.8",
            demandScore: 8
          },
          {
            title: "Strategy Consultant",
            industry: "business",
            level: "senior",
            roleType: "business",
            description: "Advises organizations on strategic direction and business decisions",
            requiredSkills: ["Strategic Analysis", "Business Strategy", "Market Research", "Competitive Analysis", "Financial Modeling", "Problem Solving", "Project Management", "Client Management"],
            averageSalary: "115000",
            growthRate: "11.5",
            demandScore: 8
          },
          {
            title: "Entrepreneur-in-Residence",
            industry: "business",
            level: "senior",
            roleType: "business",
            description: "Develops and launches new business ventures within organizations",
            requiredSkills: ["Business Model Development", "Product Development", "Market Analysis", "Fundraising", "Leadership", "Risk Assessment", "Strategic Planning", "Innovation"],
            averageSalary: "120000",
            growthRate: "10.2",
            demandScore: 7
          },
          {
            title: "Corporate Innovation Manager",
            industry: "business",
            level: "senior",
            roleType: "business",
            description: "Fosters innovation and develops new ideas within a company",
            requiredSkills: ["Innovation Management", "Design Thinking", "Product Development", "Project Management", "Change Management", "Cross-functional Collaboration", "Business Strategy", "Market Research"],
            averageSalary: "105000",
            growthRate: "13.5",
            demandScore: 8
          },
          {
            title: "Partnership Manager",
            industry: "business",
            level: "mid",
            roleType: "business",
            description: "Develops and manages strategic partnerships and alliances",
            requiredSkills: ["Relationship Management", "Strategic Partnerships", "Negotiation", "Business Development", "Contract Management", "Cross-functional Collaboration", "Value Creation", "Alliance Strategy"],
            averageSalary: "95000",
            growthRate: "11.8",
            demandScore: 7
          },
          {
            title: "Management Consultant",
            industry: "business",
            level: "senior",
            roleType: "business",
            description: "Advises organizations on improving performance and operations",
            requiredSkills: ["Business Analysis", "Process Improvement", "Project Management", "Change Management", "Problem Solving", "Industry Knowledge", "Client Management", "Presentation Skills"],
            averageSalary: "110000",
            growthRate: "10.5",
            demandScore: 8
          }
        ];
        
        // Banking roles
        const bankingRoles = [
          {
            title: "Relationship Manager",
            industry: "banking",
            level: "mid",
            roleType: "finance",
            description: "Manages client relationships and provides financial services",
            requiredSkills: ["Customer Relationship Management", "Financial Products", "Sales", "Client Service", "Financial Analysis", "Needs Assessment", "Regulatory Knowledge", "Portfolio Management"],
            averageSalary: "90000",
            growthRate: "11.2",
            demandScore: 7
          },
          {
            title: "Loan Officer",
            industry: "banking",
            level: "mid",
            roleType: "finance",
            description: "Evaluates, authorizes, and processes loan applications",
            requiredSkills: ["Loan Underwriting", "Credit Analysis", "Banking Regulations", "Financial Assessment", "Customer Service", "Documentation Review", "Risk Assessment", "Communication"],
            averageSalary: "75000",
            growthRate: "9.8",
            demandScore: 7
          },
          {
            title: "Mortgage Underwriter",
            industry: "banking",
            level: "mid",
            roleType: "finance",
            description: "Evaluates mortgage loan applications for approval",
            requiredSkills: ["Mortgage Underwriting", "Risk Assessment", "Financial Analysis", "Credit Evaluation", "Regulatory Compliance", "Documentation Review", "Decision Making", "Attention to Detail"],
            averageSalary: "78000",
            growthRate: "8.5",
            demandScore: 6
          },
          {
            title: "Compliance Officer",
            industry: "banking",
            level: "senior",
            roleType: "finance",
            description: "Ensures banking operations comply with regulations and internal policies",
            requiredSkills: ["Banking Regulations", "Compliance Programs", "Risk Assessment", "Audit Procedures", "Policy Development", "Training", "Regulatory Reporting", "Analytical Skills"],
            averageSalary: "95000",
            growthRate: "12.5",
            demandScore: 8
          },
          {
            title: "Anti-Money Laundering Analyst",
            industry: "banking",
            level: "mid",
            roleType: "finance",
            description: "Detects and prevents money laundering and financial crimes",
            requiredSkills: ["AML Regulations", "Transaction Monitoring", "Suspicious Activity Investigation", "Risk Assessment", "Compliance", "Customer Due Diligence", "Financial Crime", "Reporting"],
            averageSalary: "82000",
            growthRate: "13.8",
            demandScore: 8
          },
          {
            title: "Commercial Banker",
            industry: "banking",
            level: "senior",
            roleType: "finance",
            description: "Provides banking services to business and corporate clients",
            requiredSkills: ["Commercial Banking", "Corporate Finance", "Relationship Management", "Credit Analysis", "Financial Products", "Business Development", "Industry Knowledge", "Negotiation"],
            averageSalary: "110000",
            growthRate: "10.5",
            demandScore: 7
          },
          {
            title: "Retail Banker",
            industry: "banking",
            level: "mid",
            roleType: "finance",
            description: "Provides banking services to individual consumers",
            requiredSkills: ["Retail Banking", "Customer Service", "Sales", "Financial Products", "Cross-selling", "Cash Handling", "Banking Operations", "Regulatory Compliance"],
            averageSalary: "65000",
            growthRate: "8.2",
            demandScore: 6
          },
          {
            title: "Financial Risk Manager",
            industry: "banking",
            level: "senior",
            roleType: "finance",
            description: "Identifies and mitigates financial risks in banking operations",
            requiredSkills: ["Risk Management", "Financial Analysis", "Regulatory Requirements", "Risk Models", "Credit Risk", "Market Risk", "Operational Risk", "Stress Testing"],
            averageSalary: "115000",
            growthRate: "14.5",
            demandScore: 8
          }
        ];
        
        // Construction roles
        const constructionRoles = [
          {
            title: "Construction Project Manager",
            industry: "construction",
            level: "senior",
            roleType: "operations",
            description: "Plans, coordinates, and supervises construction projects",
            requiredSkills: ["Project Management", "Construction Methods", "Budget Management", "Schedule Development", "Contract Administration", "Team Leadership", "Risk Management", "Quality Control"],
            averageSalary: "95000",
            growthRate: "10.2",
            demandScore: 7
          },
          {
            title: "Site Engineer",
            industry: "construction",
            level: "mid",
            roleType: "technical",
            description: "Oversees technical aspects of construction projects on-site",
            requiredSkills: ["Construction Engineering", "Technical Documentation", "Quality Control", "Site Coordination", "Drawing Interpretation", "Construction Methods", "Problem Solving", "Safety Protocols"],
            averageSalary: "78000",
            growthRate: "9.5",
            demandScore: 7
          },
          {
            title: "Estimator",
            industry: "construction",
            level: "mid",
            roleType: "business",
            description: "Calculates construction project costs for bidding and planning",
            requiredSkills: ["Cost Estimation", "Quantity Takeoff", "Construction Methods", "Bidding Procedures", "Material Pricing", "Blueprint Reading", "Estimating Software", "Industry Knowledge"],
            averageSalary: "82000",
            growthRate: "10.8",
            demandScore: 7
          },
          {
            title: "BIM Specialist",
            industry: "construction",
            level: "mid",
            roleType: "technical",
            description: "Creates and manages building information models for construction projects",
            requiredSkills: ["BIM Software", "3D Modeling", "Construction Knowledge", "Technical Documentation", "Coordination", "Revit", "Clash Detection", "Model Management"],
            averageSalary: "85000",
            growthRate: "13.5",
            demandScore: 8
          },
          {
            title: "Sustainability Engineer",
            industry: "construction",
            level: "senior",
            roleType: "technical",
            description: "Develops sustainable building solutions and green construction practices",
            requiredSkills: ["Green Building Standards", "LEED Certification", "Environmental Regulations", "Energy Modeling", "Sustainable Materials", "Building Systems", "Life Cycle Assessment", "Renewable Energy"],
            averageSalary: "92000",
            growthRate: "12.8",
            demandScore: 8
          },
          {
            title: "Construction Safety Manager",
            industry: "construction",
            level: "senior",
            roleType: "operations",
            description: "Ensures safety compliance and develops safety programs for construction sites",
            requiredSkills: ["Safety Regulations", "Risk Assessment", "Safety Training", "Incident Investigation", "OSHA Compliance", "Safety Program Development", "Site Inspections", "Emergency Response"],
            averageSalary: "88000",
            growthRate: "11.5",
            demandScore: 7
          },
          {
            title: "Quantity Surveyor",
            industry: "construction",
            level: "mid",
            roleType: "business",
            description: "Manages costs and contracts for construction projects",
            requiredSkills: ["Cost Management", "Contract Administration", "Quantity Takeoff", "Procurement", "Financial Reporting", "Value Engineering", "Change Management", "Construction Methods"],
            averageSalary: "80000",
            growthRate: "9.8",
            demandScore: 7
          },
          {
            title: "Civil Engineer",
            industry: "construction",
            level: "mid",
            roleType: "technical",
            description: "Designs and oversees construction of infrastructure projects",
            requiredSkills: ["Civil Engineering", "Structural Analysis", "AutoCAD", "Construction Methods", "Project Management", "Technical Documentation", "Regulatory Compliance", "Problem Solving"],
            averageSalary: "88000",
            growthRate: "8.5",
            demandScore: 7
          }
        ];
        
        // Consulting roles
        const consultingRoles = [
          {
            title: "Management Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "business",
            description: "Advises organizations on improving business performance",
            requiredSkills: ["Business Analysis", "Strategy Development", "Process Improvement", "Change Management", "Project Management", "Client Management", "Problem Solving", "Presentation Skills"],
            averageSalary: "110000",
            growthRate: "11.5",
            demandScore: 8
          },
          {
            title: "Strategy Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "business",
            description: "Develops strategic plans and solutions for organizational challenges",
            requiredSkills: ["Strategic Planning", "Market Analysis", "Competitive Intelligence", "Business Modeling", "Strategic Frameworks", "Financial Analysis", "Research", "Executive Communication"],
            averageSalary: "120000",
            growthRate: "12.2",
            demandScore: 8
          },
          {
            title: "IT Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "technical",
            description: "Advises on technology strategy, implementation, and optimization",
            requiredSkills: ["IT Strategy", "System Architecture", "Technology Assessment", "Digital Transformation", "Requirements Analysis", "Project Management", "Technical Advisory", "Solution Design"],
            averageSalary: "105000",
            growthRate: "13.8",
            demandScore: 8
          },
          {
            title: "HR Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "human_resources",
            description: "Provides expert advice on human resources strategies and practices",
            requiredSkills: ["HR Strategy", "Organizational Development", "Talent Management", "Compensation & Benefits", "Change Management", "Employee Relations", "Training & Development", "HR Technology"],
            averageSalary: "95000",
            growthRate: "10.5",
            demandScore: 7
          },
          {
            title: "Financial Advisory Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "finance",
            description: "Provides financial expertise and advisory services to clients",
            requiredSkills: ["Financial Analysis", "Valuation", "Due Diligence", "Financial Modeling", "Transaction Advisory", "Risk Assessment", "Financial Strategy", "M&A"],
            averageSalary: "115000",
            growthRate: "11.8",
            demandScore: 8
          },
          {
            title: "Sustainability Consultant",
            industry: "consulting",
            level: "mid",
            roleType: "business",
            description: "Advises on environmental sustainability practices and strategies",
            requiredSkills: ["Sustainability Strategy", "Environmental Regulations", "Carbon Footprint Analysis", "ESG Reporting", "Stakeholder Engagement", "Sustainable Business Models", "Impact Assessment", "CSR"],
            averageSalary: "90000",
            growthRate: "14.5",
            demandScore: 8
          },
          {
            title: "Operations Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "operations",
            description: "Helps organizations improve operational efficiency and processes",
            requiredSkills: ["Operations Analysis", "Process Improvement", "Lean Six Sigma", "Supply Chain Management", "Performance Metrics", "Cost Reduction", "Production Systems", "Change Implementation"],
            averageSalary: "105000",
            growthRate: "12.5",
            demandScore: 8
          },
          {
            title: "Risk and Compliance Consultant",
            industry: "consulting",
            level: "senior",
            roleType: "business",
            description: "Advises on risk management and regulatory compliance",
            requiredSkills: ["Risk Assessment", "Compliance Frameworks", "Regulatory Knowledge", "Control Design", "Audit Procedures", "Governance", "Policy Development", "Risk Mitigation"],
            averageSalary: "100000",
            growthRate: "13.2",
            demandScore: 8
          },
          {
            title: "Scrum Master",
            industry: "consulting",
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
            industry: "consulting",
            level: "senior",
            roleType: "business",
            description: "Guides organizations in adopting and improving agile practices",
            requiredSkills: ["Agile Frameworks", "Coaching", "Change Management", "Team Development", "Process Design", "Leadership", "Continuous Improvement", "Organizational Development"],
            averageSalary: "130000",
            growthRate: "15.7",
            demandScore: 8
          },
          {
            title: "Agile Project Manager",
            industry: "consulting",
            level: "mid",
            roleType: "business",
            description: "Manages projects using agile methodologies and practices",
            requiredSkills: ["Agile Project Management", "Scrum", "Kanban", "Sprint Planning", "Stakeholder Management", "Risk Management", "Team Leadership", "Agile Metrics"],
            averageSalary: "95000",
            growthRate: "13.9",
            demandScore: 8
          },
          {
            title: "Product Owner",
            industry: "consulting",
            level: "mid",
            roleType: "business",
            description: "Represents stakeholders and defines product features in agile teams",
            requiredSkills: ["Product Backlog Management", "User Story Creation", "Prioritization", "Stakeholder Management", "Product Vision", "Requirements Analysis", "Acceptance Criteria", "Business Value Assessment"],
            averageSalary: "110000",
            growthRate: "16.2",
            demandScore: 8
          }
        ];
        
        // Pharmaceutical industry roles
        const pharmaceuticalRoles = [
          {
            title: "Clinical Trials Manager",
            industry: "pharmaceutical",
            level: "senior",
            roleType: "healthcare",
            description: "Plans and oversees clinical trials for drug development",
            requiredSkills: ["Clinical Trial Management", "Regulatory Compliance", "Protocol Development", "Site Management", "Budget Planning", "GCP Guidelines", "Team Leadership", "Data Management"],
            averageSalary: "105000",
            growthRate: "11.8",
            demandScore: 8
          },
          {
            title: "Pharmacovigilance Specialist",
            industry: "pharmaceutical",
            level: "mid",
            roleType: "healthcare",
            description: "Monitors and evaluates adverse drug reactions and safety",
            requiredSkills: ["Drug Safety", "Adverse Event Reporting", "Regulatory Requirements", "Signal Detection", "Safety Databases", "Risk Management", "Medical Terminology", "Case Processing"],
            averageSalary: "85000",
            growthRate: "12.5",
            demandScore: 7
          },
          {
            title: "Regulatory Affairs Specialist",
            industry: "pharmaceutical",
            level: "mid",
            roleType: "healthcare",
            description: "Ensures compliance with regulatory requirements for drug approval",
            requiredSkills: ["Regulatory Compliance", "Submission Preparation", "FDA Regulations", "Documentation", "Product Labeling", "Regulatory Strategy", "Liaison with Authorities", "Submission Management"],
            averageSalary: "90000",
            growthRate: "10.5",
            demandScore: 7
          },
          {
            title: "Pharmaceutical Sales Representative",
            industry: "pharmaceutical",
            level: "mid",
            roleType: "sales",
            description: "Promotes pharmaceutical products to healthcare professionals",
            requiredSkills: ["Pharmaceutical Knowledge", "Sales Techniques", "Medical Terminology", "Relationship Building", "Product Knowledge", "Territory Management", "Healthcare Industry", "Presentation Skills"],
            averageSalary: "85000",
            growthRate: "8.5",
            demandScore: 7
          },
          {
            title: "Biostatistician",
            industry: "pharmaceutical",
            level: "senior",
            roleType: "research",
            description: "Analyzes and interprets data from clinical trials and research",
            requiredSkills: ["Biostatistics", "Statistical Software", "Clinical Trial Design", "Data Analysis", "Study Protocol", "Statistical Methods", "Regulatory Requirements", "Research Methodology"],
            averageSalary: "98000",
            growthRate: "13.2",
            demandScore: 8
          },
          {
            title: "Medical Science Liaison",
            industry: "pharmaceutical",
            level: "senior",
            roleType: "healthcare",
            description: "Serves as scientific resource for healthcare professionals",
            requiredSkills: ["Medical Knowledge", "Scientific Communication", "Healthcare Industry", "Relationship Building", "Clinical Research", "Therapeutic Area Expertise", "Presentation Skills", "KOL Management"],
            averageSalary: "115000",
            growthRate: "12.8",
            demandScore: 8
          },
          {
            title: "Drug Safety Associate",
            industry: "pharmaceutical",
            level: "mid",
            roleType: "healthcare",
            description: "Monitors and reports on drug safety issues",
            requiredSkills: ["Pharmacovigilance", "Adverse Event Processing", "Medical Terminology", "Safety Databases", "Regulatory Reporting", "Case Assessment", "Risk Management", "Medical Writing"],
            averageSalary: "80000",
            growthRate: "11.5",
            demandScore: 7
          },
          {
            title: "Formulation Scientist",
            industry: "pharmaceutical",
            level: "senior",
            roleType: "research",
            description: "Develops pharmaceutical formulations for drug delivery",
            requiredSkills: ["Formulation Development", "Pharmaceutical Chemistry", "Product Development", "Analytical Methods", "Stability Testing", "Manufacturing Processes", "Problem Solving", "Documentation"],
            averageSalary: "95000",
            growthRate: "9.8",
            demandScore: 7
          },
          {
            title: "Pharmaceutical Research Scientist",
            industry: "pharmaceutical",
            level: "senior",
            roleType: "research",
            description: "Conducts research to develop new drugs and therapies",
            requiredSkills: ["Drug Discovery", "Laboratory Techniques", "Research Design", "Data Analysis", "Scientific Literature", "Experimental Methods", "Collaboration", "Technical Writing"],
            averageSalary: "100000",
            growthRate: "10.2",
            demandScore: 7
          }
        ];
        
        // Add all roles to the database
        const allNewRoles = [
          ...marketingRoles,
          ...financeRoles,
          ...healthcareRoles,
          ...educationRoles,
          ...hrRoles,
          ...operationsRoles,
          ...logisticsRoles,
          ...businessRoles,
          ...bankingRoles,
          ...constructionRoles,
          ...consultingRoles,
          ...pharmaceuticalRoles
        ];
        
        // Use upsert pattern for all roles
        const createdRoles = [];
        let updatedCount = 0;
        let newCount = 0;
        
        for (const role of allNewRoles) {
          // Check if a role with this title already exists
          const existingRole = await storage.getInterviewRoleByTitle(role.title);
          
          if (existingRole) {
            // Update the existing role
            const updatedRole = await storage.updateInterviewRole(existingRole.id, role);
            if (updatedRole) {
              createdRoles.push(updatedRole);
              updatedCount++;
              console.log(`Updated existing role: ${role.title}`);
            }
          } else {
            // Create a new role
            const newRole = await storage.createInterviewRole(role);
            createdRoles.push(newRole);
            newCount++;
            console.log(`Added new role: ${role.title}`);
          }
        }
        
        res.status(200).json({
          message: "Industry roles updated successfully",
          updatedCount: updatedCount,
          newCount: newCount,
          totalCount: createdRoles.length,
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

  // Get user skills - for skill assessments
  app.get(
    "/api/users/skills",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // For now, we're using userId = 1 for demo purposes
        const userId = 1;
        
        const userSkills = await storage.getUserSkillsByUserId(userId);
        res.json(userSkills);
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Update user skill after assessment
  app.post(
    "/api/users/skills/assessment",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // For now, we're using userId = 1 for demo purposes
        const userId = 1;
        const { skillId, currentLevel, assessmentResult } = req.body;
        
        if (!skillId || currentLevel === undefined) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        
        // Check if user skill exists
        const existingSkill = await storage.getUserSkillBySkillId(userId, skillId);
          
        if (existingSkill) {
          // Update existing skill
          const updatedSkill = await storage.updateUserSkill(userId, skillId, {
            currentLevel,
            lastAssessed: new Date().toISOString(),
            notes: `Last assessment score: ${assessmentResult || 'N/A'}`
          });
            
          return res.json(updatedSkill);
        } else {
          // Create new user skill entry
          const newSkill = await storage.createUserSkill({
            userId,
            skillId,
            currentLevel,
            targetLevel: Math.min(currentLevel + 1, 5), // Default target is one level higher, max 5
            lastAssessed: new Date().toISOString(),
            notes: `Initial assessment score: ${assessmentResult || 'N/A'}`
          });
            
          return res.status(201).json(newSkill);
        }
      } catch (error) {
        next(error);
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
