import {
  users, User, InsertUser,
  careerGoals, CareerGoal, InsertCareerGoal,
  skills, Skill, InsertSkill,
  userSkills, UserSkill, InsertUserSkill,
  learningResources, LearningResource, InsertLearningResource,
  learningPaths, LearningPath, InsertLearningPath,
  userProgress, UserProgress, InsertUserProgress,
  userActivities, UserActivity, InsertUserActivity,
  skillValidations, SkillValidation, InsertSkillValidation,
  userResourceProgress, UserResourceProgress, InsertUserResourceProgress,
  interviewRoles, InterviewRole, InsertInterviewRole,
  interviewQuestions, InterviewQuestion, InsertInterviewQuestion,
  interviewSessions, InterviewSession, InsertInterviewSession,
  careerPaths, CareerPath, InsertCareerPath
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

// Comprehensive storage interface for all CRUD operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
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
  getUserSkillBySkillId(userId: number, skillId: number): Promise<UserSkill | undefined>;
  createUserSkill(userSkill: InsertUserSkill): Promise<UserSkill>;
  updateUserSkill(id: number, userSkillData: Partial<InsertUserSkill>): Promise<UserSkill | undefined>;
  updateUserSkill(userId: number, skillId: number, userSkillData: Partial<InsertUserSkill>): Promise<UserSkill | undefined>;
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
  
  // User resource progress methods
  getUserResourceProgress(id: number): Promise<UserResourceProgress | undefined>;
  getUserResourceProgressByUserId(userId: number): Promise<UserResourceProgress[]>;
  getUserResourceProgressByResourceId(resourceId: number): Promise<UserResourceProgress[]>;
  getUserResourceProgressByUserAndResource(userId: number, resourceId: number): Promise<UserResourceProgress | undefined>;
  createUserResourceProgress(progress: InsertUserResourceProgress): Promise<UserResourceProgress>;
  updateUserResourceProgress(id: number, progressData: Partial<InsertUserResourceProgress>): Promise<UserResourceProgress | undefined>;
  deleteUserResourceProgress(id: number): Promise<boolean>;
  calculateUserProgressStats(userId: number): Promise<{ 
    overallPercent: number, 
    skills: Array<{
      skillId: number,
      skillName: string,
      completed: number,
      total: number,
      percent: number
    }> 
  }>;
  
  // Interview role methods
  getInterviewRole(id: number): Promise<InterviewRole | undefined>;
  getAllInterviewRoles(): Promise<InterviewRole[]>;
  getInterviewRolesByIndustry(industry: string): Promise<InterviewRole[]>;
  getInterviewRolesByLevel(level: string): Promise<InterviewRole[]>;
  createInterviewRole(role: InsertInterviewRole): Promise<InterviewRole>;
  updateInterviewRole(id: number, roleData: Partial<InsertInterviewRole>): Promise<InterviewRole | undefined>;
  deleteInterviewRole(id: number): Promise<boolean>;
  
  // Interview question methods
  getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined>;
  getInterviewQuestionsByRole(roleId: number): Promise<InterviewQuestion[]>;
  getInterviewQuestionsByCategory(category: string): Promise<InterviewQuestion[]>;
  getInterviewQuestionsByDifficulty(difficulty: string): Promise<InterviewQuestion[]>;
  getInterviewQuestionsBySkill(skillId: number): Promise<InterviewQuestion[]>;
  createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion>;
  updateInterviewQuestion(id: number, questionData: Partial<InsertInterviewQuestion>): Promise<InterviewQuestion | undefined>;
  deleteInterviewQuestion(id: number): Promise<boolean>;
  
  // Interview session methods
  getInterviewSession(id: number): Promise<InterviewSession | undefined>;
  getInterviewSessionsByUserId(userId: number): Promise<InterviewSession[]>;
  getInterviewSessionsByRole(roleId: number): Promise<InterviewSession[]>;
  createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession>;
  updateInterviewSession(id: number, sessionData: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined>;
  deleteInterviewSession(id: number): Promise<boolean>;

  // Career path methods
  getCareerPath(id: number): Promise<CareerPath | undefined>;
  getAllCareerPaths(): Promise<CareerPath[]>;
  getCareerPathByRoleId(roleId: number): Promise<CareerPath | undefined>;
  createCareerPath(path: InsertCareerPath): Promise<CareerPath>;
  updateCareerPath(id: number, pathData: Partial<InsertCareerPath>): Promise<CareerPath | undefined>;
  deleteCareerPath(id: number): Promise<boolean>;
  
  // Role methods
  getRoles(): Promise<any[]>;
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
  private interviewRolesMap: Map<number, InterviewRole>;
  private interviewQuestionsMap: Map<number, InterviewQuestion>;
  private interviewSessionsMap: Map<number, InterviewSession>;
  private careerPathsMap: Map<number, CareerPath>;

  private currentUserID: number = 1;
  private currentCareerGoalID: number = 1;
  private currentSkillID: number = 1;
  private currentUserSkillID: number = 1;
  private currentLearningResourceID: number = 1;
  private currentLearningPathID: number = 1;
  private currentUserProgressID: number = 1;
  private currentUserActivityID: number = 1;
  private currentSkillValidationID: number = 1;
  private currentInterviewRoleID: number = 1;
  private currentInterviewQuestionID: number = 1;
  private currentInterviewSessionID: number = 1;
  private currentCareerPathID: number = 1;

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
    this.interviewRolesMap = new Map();
    this.interviewQuestionsMap = new Map();
    this.interviewSessionsMap = new Map();
    this.careerPathsMap = new Map();

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
    
    // Create default skills for assessment
    const defaultSkills = [
      // Technical skills
      { name: 'JavaScript', category: 'technical', description: 'Programming language for web development' },
      { name: 'React', category: 'technical', description: 'Frontend library for building user interfaces' },
      { name: 'Node.js', category: 'technical', description: 'JavaScript runtime for server-side development' },
      { name: 'Python', category: 'technical', description: 'General-purpose programming language' },
      { name: 'SQL', category: 'technical', description: 'Language for managing relational databases' },
      { name: 'Machine Learning', category: 'technical', description: 'Building systems that learn from data' },
      { name: 'Cloud Computing', category: 'technical', description: 'Using remote servers for computing resources' },
      { name: 'DevOps', category: 'technical', description: 'Development and operations integration' },
      
      // Communication skills
      { name: 'Written Communication', category: 'soft', description: 'Ability to write clearly and effectively' },
      { name: 'Verbal Communication', category: 'soft', description: 'Ability to speak clearly and articulate ideas' },
      { name: 'Presentation Skills', category: 'soft', description: 'Creating and delivering effective presentations' },
      { name: 'Negotiation', category: 'soft', description: 'Finding mutually beneficial agreements' },
      
      // Leadership skills
      { name: 'Team Management', category: 'leadership', description: 'Coordinating and motivating teams' },
      { name: 'Strategic Planning', category: 'leadership', description: 'Creating and implementing strategic objectives' },
      { name: 'Decision Making', category: 'leadership', description: 'Making sound decisions in complex situations' },
      { name: 'Conflict Resolution', category: 'leadership', description: 'Resolving disputes constructively' },
      
      // Creative skills
      { name: 'Design Thinking', category: 'creative', description: 'Problem-solving approach centered on users' },
      { name: 'UX/UI Design', category: 'creative', description: 'Creating intuitive and engaging user experiences' },
      { name: 'Content Creation', category: 'creative', description: 'Developing compelling written, visual, or audio content' },
      { name: 'Innovation', category: 'creative', description: 'Generating and implementing new ideas' }
    ];

    defaultUsers.forEach(user => this.createUser(user));
    
    // Create default skills for assessment
    defaultSkills.forEach(skill => this.createSkill(skill));

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

    // Create the learning resources
    defaultResources.forEach(resource => this.createLearningResource(resource));

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
    
    // Create interview roles
    const defaultInterviewRoles = [
      // Original roles
      {
        title: 'Frontend Developer',
        description: 'A frontend developer implements the visual elements of web applications that users interact with.',
        requiredSkills: ['JavaScript', 'React', 'HTML', 'CSS'],
        industry: 'Technology',
        level: 'mid',
        roleType: 'development'
      },
      {
        title: 'Data Scientist',
        description: 'A data scientist analyzes data to extract meaningful insights and build predictive models.',
        requiredSkills: ['Python', 'Statistics', 'Machine Learning', 'SQL'],
        industry: 'Technology',
        level: 'senior',
        roleType: 'data'
      },
      {
        title: 'Product Manager',
        description: 'A product manager oversees product development and brings products to market.',
        requiredSkills: ['Product Strategy', 'User Research', 'Roadmapping', 'Stakeholder Management'],
        industry: 'Technology',
        level: 'mid',
        roleType: 'management'
      },
      
      // Software Development & Engineering
      {
        title: 'Software Engineer',
        description: 'Designs, develops, and maintains software applications and systems.',
        requiredSkills: ['Software Development', 'Algorithms', 'Data Structures', 'Problem Solving'],
        industry: 'Technology',
        level: 'entry',
        roleType: 'development'
      },
      {
        title: 'Senior Software Engineer',
        description: 'Leads development efforts and provides technical guidance to junior engineers.',
        requiredSkills: ['Advanced Programming', 'System Design', 'Architecture', 'Technical Leadership'],
        industry: 'Technology',
        level: 'senior',
        roleType: 'development'
      },
      {
        title: 'Full Stack Developer',
        description: 'Develops both client and server software for web applications.',
        requiredSkills: ['Front-end', 'Back-end', 'Databases', 'APIs'],
        industry: 'Technology',
        level: 'mid',
        roleType: 'development'
      },
      {
        title: 'Back-End Developer',
        description: 'Focuses on server-side logic, databases, and application architecture.',
        requiredSkills: ['Server Languages', 'Databases', 'APIs', 'Security'],
        industry: 'Technology',
        level: 'mid',
        roleType: 'development'
      },
      
      // Data Science & Analytics
      {
        title: 'Data Analyst',
        description: 'Interprets data to identify trends and creates visualizations to communicate findings.',
        requiredSkills: ['Data Analysis', 'SQL', 'Excel', 'Data Visualization'],
        industry: 'Analytics',
        level: 'entry',
        roleType: 'data'
      },
      {
        title: 'Data Engineer',
        description: 'Builds and maintains data pipelines and infrastructure for data processing.',
        requiredSkills: ['ETL', 'Data Warehousing', 'SQL', 'Big Data Technologies'],
        industry: 'Analytics',
        level: 'mid',
        roleType: 'data'
      },
      {
        title: 'Machine Learning Engineer',
        description: 'Develops and deploys machine learning models into production environments.',
        requiredSkills: ['ML Algorithms', 'Python', 'Model Deployment', 'MLOps'],
        industry: 'Analytics',
        level: 'senior',
        roleType: 'data'
      },
      
      // Cloud Computing & DevOps
      {
        title: 'Cloud Engineer',
        description: 'Designs, implements, and manages cloud-based systems and infrastructure.',
        requiredSkills: ['Cloud Platforms', 'Infrastructure as Code', 'Network Architecture', 'Security'],
        industry: 'Cloud Computing',
        level: 'mid',
        roleType: 'infrastructure'
      },
      {
        title: 'DevOps Engineer',
        description: 'Bridges development and operations to streamline deployment processes.',
        requiredSkills: ['CI/CD', 'Containerization', 'Infrastructure as Code', 'Monitoring'],
        industry: 'Cloud Computing',
        level: 'mid',
        roleType: 'infrastructure'
      },
      {
        title: 'Site Reliability Engineer',
        description: 'Ensures that systems are reliable, scalable, and efficient.',
        requiredSkills: ['System Design', 'Automation', 'Monitoring', 'Incident Response'],
        industry: 'Cloud Computing',
        level: 'senior',
        roleType: 'infrastructure'
      },
      
      // Cybersecurity
      {
        title: 'Cybersecurity Engineer',
        description: 'Protects computer systems and networks from threats and vulnerabilities.',
        requiredSkills: ['Security Systems', 'Threat Analysis', 'Vulnerability Assessment', 'Security Protocols'],
        industry: 'Cybersecurity',
        level: 'mid',
        roleType: 'security'
      },
      {
        title: 'Penetration Tester',
        description: 'Identifies security vulnerabilities by simulating cyberattacks.',
        requiredSkills: ['Ethical Hacking', 'Security Tools', 'Vulnerability Assessment', 'Security Reporting'],
        industry: 'Cybersecurity',
        level: 'mid',
        roleType: 'security'
      },
      
      // Project Management
      {
        title: 'Project Manager',
        description: 'Plans, executes, and closes projects, ensuring they are completed on time and within budget.',
        requiredSkills: ['Project Planning', 'Risk Management', 'Team Leadership', 'Stakeholder Communication'],
        industry: 'Management',
        level: 'mid',
        roleType: 'management'
      },
      {
        title: 'Scrum Master',
        description: 'Facilitates agile development processes and removes impediments for the team.',
        requiredSkills: ['Agile Methodologies', 'Team Facilitation', 'Servant Leadership', 'Problem Solving'],
        industry: 'Management',
        level: 'mid',
        roleType: 'management'
      },
      
      // Specialized Technical Roles
      {
        title: 'UI/UX Designer',
        description: 'Creates user-friendly interfaces and experiences for digital products.',
        requiredSkills: ['User Research', 'Wireframing', 'Prototyping', 'Visual Design'],
        industry: 'Design',
        level: 'mid',
        roleType: 'design'
      },
      {
        title: 'Blockchain Developer',
        description: 'Develops decentralized applications and smart contracts on blockchain platforms.',
        requiredSkills: ['Smart Contracts', 'Blockchain Protocols', 'Cryptography', 'DApp Development'],
        industry: 'Emerging Tech',
        level: 'mid',
        roleType: 'development'
      },
      {
        title: 'AI Specialist',
        description: 'Develops and implements artificial intelligence solutions for business problems.',
        requiredSkills: ['Deep Learning', 'Neural Networks', 'Natural Language Processing', 'Computer Vision'],
        industry: 'Emerging Tech',
        level: 'senior',
        roleType: 'data'
      }
    ];
    
    // Create interview roles
    defaultInterviewRoles.forEach(role => this.createInterviewRole(role));
    
    // Create initial career paths
    const defaultCareerPaths = [
      // Original career paths
      {
        roleId: 1, // Frontend Developer
        previousRole: "Junior Frontend Developer",
        nextRole: "Senior Frontend Developer",
        yearsToProgress: 3,
        skillsToAcquire: ["Advanced JavaScript", "React Performance Optimization", "Design Systems", "Unit Testing", "CI/CD", "Architecture"],
        typicalTransitionPath: "Junior → Mid-level → Senior → Lead → Engineering Manager"
      },
      {
        roleId: 2, // Data Scientist
        previousRole: "Data Analyst",
        nextRole: "Lead Data Scientist",
        yearsToProgress: 4,
        skillsToAcquire: ["Advanced Machine Learning", "MLOps", "Team Leadership", "Business Strategy", "Research Publishing", "Domain Expertise"],
        typicalTransitionPath: "Analyst → Data Scientist → Senior → Lead → Director of Data Science"
      },
      {
        roleId: 3, // Product Manager
        previousRole: "Business Analyst",
        nextRole: "Senior Product Manager",
        yearsToProgress: 3,
        skillsToAcquire: ["User Research", "Product Strategy", "Stakeholder Management", "KPI Analysis", "Roadmapping", "Market Analysis"],
        typicalTransitionPath: "Analyst → Associate PM → PM → Senior PM → Director of Product"
      },
      
      // New career paths
      {
        roleId: 4, // Software Engineer
        previousRole: "Junior Software Engineer",
        nextRole: "Senior Software Engineer",
        yearsToProgress: 3,
        skillsToAcquire: ["System Design", "Design Patterns", "Code Optimization", "Mentoring", "Technical Documentation", "Architectural Decisions"],
        typicalTransitionPath: "Junior → Software Engineer → Senior → Principal → Architect"
      },
      {
        roleId: 5, // Senior Software Engineer
        previousRole: "Software Engineer",
        nextRole: "Principal Engineer",
        yearsToProgress: 4,
        skillsToAcquire: ["Technical Leadership", "System Architecture", "Cross-team Collaboration", "Project Planning", "Code Reviews", "Architectural Decisions"],
        typicalTransitionPath: "Software Engineer → Senior → Principal → Architect or Engineering Manager"
      },
      {
        roleId: 8, // Data Analyst
        previousRole: "Junior Data Analyst",
        nextRole: "Senior Data Analyst",
        yearsToProgress: 2,
        skillsToAcquire: ["Advanced SQL", "Statistical Analysis", "Data Visualization Tools", "Business Domain Knowledge", "Dashboard Creation", "Storytelling with Data"],
        typicalTransitionPath: "Junior Analyst → Data Analyst → Senior Analyst → Data Scientist or Analytics Manager"
      },
      {
        roleId: 9, // Data Engineer
        previousRole: "Data Analyst",
        nextRole: "Senior Data Engineer",
        yearsToProgress: 3,
        skillsToAcquire: ["Data Pipeline Development", "Big Data Technologies", "Cloud Data Services", "Data Modeling", "Performance Optimization", "Data Governance"],
        typicalTransitionPath: "Data Analyst → Data Engineer → Senior Data Engineer → Data Architect"
      },
      {
        roleId: 11, // Cloud Engineer
        previousRole: "System Administrator",
        nextRole: "Cloud Architect",
        yearsToProgress: 3,
        skillsToAcquire: ["Multi-Cloud Strategy", "Cloud Security", "Cost Optimization", "Serverless Architecture", "Containerization", "Infrastructure as Code"],
        typicalTransitionPath: "SysAdmin → Cloud Engineer → Senior Cloud Engineer → Cloud Architect"
      },
      {
        roleId: 12, // DevOps Engineer
        previousRole: "System Administrator",
        nextRole: "DevOps Lead",
        yearsToProgress: 3,
        skillsToAcquire: ["CI/CD Pipeline Design", "Infrastructure as Code", "Container Orchestration", "Monitoring Solutions", "Security Automation", "Release Management"],
        typicalTransitionPath: "SysAdmin → DevOps Engineer → DevOps Lead → DevOps Architect"
      },
      {
        roleId: 14, // Cybersecurity Engineer
        previousRole: "IT Support Specialist",
        nextRole: "Security Architect",
        yearsToProgress: 4,
        skillsToAcquire: ["Threat Modeling", "Security Frameworks", "Security Automation", "Risk Assessment", "Security Architecture", "Compliance Standards"],
        typicalTransitionPath: "IT Support → Security Analyst → Security Engineer → Security Architect → CISO"
      }
    ];
    
    // Create the career paths
    defaultCareerPaths.forEach(path => this.createCareerPath(path));
    
    // Create interview questions
    const defaultInterviewQuestions = [
      // Frontend Developer Questions
      {
        roleId: 1,
        question: 'Can you explain the difference between controlled and uncontrolled components in React?',
        category: 'technical',
        difficulty: 'medium',
        expectedAnswerPoints: [
          'Controlled components: form elements controlled by React state',
          'Uncontrolled components: form elements that maintain their own state',
          'Controlled components use onChange handlers to update state',
          'Uncontrolled components use refs to access DOM values',
          'Controlled components offer more control and validation capabilities'
        ],
        sampleAnswer: "Controlled components in React are form elements where the value is controlled by React state. When a user inputs data, an onChange event handler updates the state, making React the 'single source of truth'. Uncontrolled components, on the other hand, maintain their own internal state, and you access their values using refs. Controlled components provide more control and validation capabilities but may require more code. Uncontrolled components are simpler but offer less control over the input behavior and validation.",
        relatedSkillIds: ['2', '6']
      },
      {
        roleId: 1,
        question: 'Describe a situation where you had to optimize a web application for performance. What tools and techniques did you use?',
        category: 'behavioral',
        difficulty: 'medium',
        expectedAnswerPoints: [
          'Identifying performance bottlenecks using tools like Lighthouse or Chrome DevTools',
          'Code splitting and lazy loading to reduce initial bundle size',
          'Image optimization techniques',
          'Caching strategies',
          'Measuring performance improvements with metrics like FCP, LCP, and TTI'
        ],
        sampleAnswer: "In my previous project, we noticed slow loading times on our e-commerce platform. I used Lighthouse and Chrome DevTools to identify bottlenecks, finding that large JavaScript bundles and unoptimized images were the main issues. I implemented code splitting with React.lazy to reduce the initial bundle size, optimized images using WebP format and lazy loading, and implemented a caching strategy for API responses. These changes improved our Largest Contentful Paint (LCP) by 40% and increased conversion rates by 15%. We tracked these improvements using Lighthouse CI in our deployment pipeline.",
        relatedSkillIds: ['2', '6']
      },
      // Data Scientist Questions
      {
        roleId: 2,
        question: 'How would you handle a dataset with significant missing values?',
        category: 'technical',
        difficulty: 'medium',
        expectedAnswerPoints: [
          'Analyze patterns of missingness (MCAR, MAR, MNAR)',
          'Visualization of missing data patterns',
          'Simple imputation methods (mean, median, mode)',
          'Advanced imputation techniques (KNN, regression, MICE)',
          'When to consider removing samples or features',
          'Evaluating the impact of imputation on model performance'
        ],
        sampleAnswer: "When dealing with missing values, I first analyze the pattern of missingness to determine if it's Missing Completely at Random (MCAR), Missing at Random (MAR), or Missing Not at Random (MNAR). I use visualization tools like missingno in Python to identify patterns. For MCAR data, simple imputation methods like mean, median, or mode replacement might suffice. For more complex patterns, I use advanced techniques like KNN imputation, regression imputation, or Multiple Imputation by Chained Equations (MICE). If a feature has too many missing values (>50%), I consider removing it. Similarly, if certain samples have too many missing features, they might be candidates for removal. After imputation, I validate the impact on model performance, often by comparing results with and without imputation or by using cross-validation.",
        relatedSkillIds: ['1', '3']
      },
      {
        roleId: 2,
        question: 'Describe a challenging data project you worked on. What was your approach, and what insights did you discover?',
        category: 'behavioral',
        difficulty: 'hard',
        expectedAnswerPoints: [
          'Clear problem definition',
          'Methodology selection and justification',
          'Challenges encountered and solutions implemented',
          'Communication of results to stakeholders',
          'Business impact of the project',
          'Lessons learned'
        ],
        sampleAnswer: "I led a project to predict customer churn for a subscription service with 500,000+ users. The challenge was combining diverse data sources (usage logs, customer service interactions, payment history) while ensuring data privacy compliance. I implemented a feature engineering pipeline that created 200+ features from these sources, then used SHAP values to identify key churn indicators. The most challenging aspect was handling class imbalance, which I addressed using SMOTE and adjusting class weights. We deployed a gradient boosting model that improved churn prediction by 35% over the previous system, allowing customer success teams to proactively engage at-risk customers. This reduced churn by 12%, saving approximately $1.2M annually. The key lesson was that combining domain expertise with data science techniques was crucial - several of our most predictive features came from customer service team suggestions.",
        relatedSkillIds: ['1', '3', '8']
      },
      // Product Manager Questions
      {
        roleId: 3,
        question: 'How do you prioritize features for your product roadmap?',
        category: 'scenario',
        difficulty: 'medium',
        expectedAnswerPoints: [
          'Framework usage (e.g., RICE, Kano, MoSCoW)',
          'Data-driven decision making',
          'Alignment with business objectives',
          'Balancing stakeholder needs',
          'Considering resource constraints',
          'Iterative approach to prioritization'
        ],
        sampleAnswer: "I use a combination of frameworks and data to prioritize features. First, I ensure alignment with our strategic goals and KPIs. Then I apply the RICE framework (Reach, Impact, Confidence, Effort) to score potential features. I gather inputs from user research, support tickets, sales feedback, and usage analytics to quantify each dimension. I also consider our engineering constraints and dependencies. Once I have the initial prioritization, I review it with key stakeholders to ensure alignment. The final roadmap balances quick wins with strategic initiatives, and I revisit priorities regularly as we gather new data from market changes and user feedback. This approach helped us identify a previously overlooked feature that became our highest-converting acquisition channel last quarter.",
        relatedSkillIds: ['4', '5', '8']
      },
      {
        roleId: 3,
        question: 'Tell me about a time when you had to make a difficult decision about your product that faced significant pushback from stakeholders.',
        category: 'behavioral',
        difficulty: 'hard',
        expectedAnswerPoints: [
          'Clear decision-making process',
          'Evidence-based approach',
          'Stakeholder management techniques',
          'Communication strategy',
          'Outcome and impact',
          'Lessons learned'
        ],
        sampleAnswer: "We needed to deprecate a legacy feature used by only 5% of customers but consuming 30% of engineering resources. The sales team strongly opposed this decision, fearing customer backlash. I prepared a comprehensive analysis showing the feature's usage decline, maintenance cost, and impact on our development velocity. I then met individually with key stakeholders to understand their concerns. Rather than forcing a decision, I proposed a phased approach: first improving our analytics to better understand usage patterns, then developing migration paths for affected customers, followed by a 6-month sunset period with dedicated support. I created clear communication materials highlighting how this change would ultimately benefit customers through faster delivery of more valuable features. The gradual approach and data-backed reasoning helped bring stakeholders on board. In the end, we successfully deprecated the feature with minimal customer impact and reallocated resources to innovations that increased user engagement by 40%.",
        relatedSkillIds: ['5', '8']
      }
    ];
    
    defaultInterviewQuestions.forEach(question => this.createInterviewQuestion(question));
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

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.googleId === googleId);
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(user => user.resetPasswordToken === token);
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

  // Interview role methods
  async getInterviewRole(id: number): Promise<InterviewRole | undefined> {
    return this.interviewRolesMap.get(id);
  }

  async getAllInterviewRoles(): Promise<InterviewRole[]> {
    return Array.from(this.interviewRolesMap.values());
  }

  async getInterviewRolesByIndustry(industry: string): Promise<InterviewRole[]> {
    return Array.from(this.interviewRolesMap.values())
      .filter(role => role.industry === industry);
  }

  async getInterviewRolesByLevel(level: string): Promise<InterviewRole[]> {
    return Array.from(this.interviewRolesMap.values())
      .filter(role => role.level === level);
  }

  async createInterviewRole(role: InsertInterviewRole): Promise<InterviewRole> {
    const id = this.currentInterviewRoleID++;
    const interviewRole: InterviewRole = {
      ...role,
      id,
      createdAt: new Date()
    };
    this.interviewRolesMap.set(id, interviewRole);
    return interviewRole;
  }

  async updateInterviewRole(id: number, roleData: Partial<InsertInterviewRole>): Promise<InterviewRole | undefined> {
    const currentRole = await this.getInterviewRole(id);
    if (!currentRole) return undefined;

    const updatedRole: InterviewRole = {
      ...currentRole,
      ...roleData
    };
    this.interviewRolesMap.set(id, updatedRole);
    return updatedRole;
  }

  async deleteInterviewRole(id: number): Promise<boolean> {
    return this.interviewRolesMap.delete(id);
  }

  // Interview question methods
  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    return this.interviewQuestionsMap.get(id);
  }

  async getInterviewQuestionsByRole(roleId: number): Promise<InterviewQuestion[]> {
    return Array.from(this.interviewQuestionsMap.values())
      .filter(question => question.roleId === roleId);
  }

  async getInterviewQuestionsByCategory(category: string): Promise<InterviewQuestion[]> {
    return Array.from(this.interviewQuestionsMap.values())
      .filter(question => question.category === category);
  }

  async getInterviewQuestionsByDifficulty(difficulty: string): Promise<InterviewQuestion[]> {
    return Array.from(this.interviewQuestionsMap.values())
      .filter(question => question.difficulty === difficulty);
  }

  async getInterviewQuestionsBySkill(skillId: number): Promise<InterviewQuestion[]> {
    const skillIdStr = skillId.toString();
    return Array.from(this.interviewQuestionsMap.values())
      .filter(question => question.relatedSkillIds && question.relatedSkillIds.includes(skillIdStr));
  }

  async createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const id = this.currentInterviewQuestionID++;
    const interviewQuestion: InterviewQuestion = {
      ...question,
      id
    };
    this.interviewQuestionsMap.set(id, interviewQuestion);
    return interviewQuestion;
  }

  async updateInterviewQuestion(id: number, questionData: Partial<InsertInterviewQuestion>): Promise<InterviewQuestion | undefined> {
    const currentQuestion = await this.getInterviewQuestion(id);
    if (!currentQuestion) return undefined;

    const updatedQuestion: InterviewQuestion = {
      ...currentQuestion,
      ...questionData
    };
    this.interviewQuestionsMap.set(id, updatedQuestion);
    return updatedQuestion;
  }

  async deleteInterviewQuestion(id: number): Promise<boolean> {
    return this.interviewQuestionsMap.delete(id);
  }

  // Interview session methods
  async getInterviewSession(id: number): Promise<InterviewSession | undefined> {
    return this.interviewSessionsMap.get(id);
  }

  async getInterviewSessionsByUserId(userId: number): Promise<InterviewSession[]> {
    return Array.from(this.interviewSessionsMap.values())
      .filter(session => session.userId === userId);
  }

  async getInterviewSessionsByRole(roleId: number): Promise<InterviewSession[]> {
    return Array.from(this.interviewSessionsMap.values())
      .filter(session => session.roleId === roleId);
  }

  async createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession> {
    const id = this.currentInterviewSessionID++;
    const interviewSession: InterviewSession = {
      ...session,
      id,
      sessionDate: session.sessionDate || new Date()
    };
    this.interviewSessionsMap.set(id, interviewSession);
    return interviewSession;
  }

  async updateInterviewSession(id: number, sessionData: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined> {
    const currentSession = await this.getInterviewSession(id);
    if (!currentSession) return undefined;

    const updatedSession: InterviewSession = {
      ...currentSession,
      ...sessionData
    };
    this.interviewSessionsMap.set(id, updatedSession);
    return updatedSession;
  }

  async deleteInterviewSession(id: number): Promise<boolean> {
    return this.interviewSessionsMap.delete(id);
  }

  // Career path methods
  async getCareerPath(id: number): Promise<CareerPath | undefined> {
    return this.careerPathsMap.get(id);
  }

  async getAllCareerPaths(): Promise<CareerPath[]> {
    return Array.from(this.careerPathsMap.values());
  }

  async getCareerPathByRoleId(roleId: number): Promise<CareerPath | undefined> {
    return Array.from(this.careerPathsMap.values())
      .find(path => path.roleId === roleId);
  }

  async createCareerPath(path: InsertCareerPath): Promise<CareerPath> {
    const id = this.currentCareerPathID++;
    const careerPath: CareerPath = {
      ...path,
      id,
      createdAt: new Date()
    };
    this.careerPathsMap.set(id, careerPath);
    return careerPath;
  }

  async updateCareerPath(id: number, pathData: Partial<InsertCareerPath>): Promise<CareerPath | undefined> {
    const currentPath = await this.getCareerPath(id);
    if (!currentPath) return undefined;

    const updatedPath: CareerPath = {
      ...currentPath,
      ...pathData
    };
    this.careerPathsMap.set(id, updatedPath);
    return updatedPath;
  }

  async deleteCareerPath(id: number): Promise<boolean> {
    return this.careerPathsMap.delete(id);
  }
  
  // Implementation of Role methods
  async getRoles(): Promise<any[]> {
    // Predefined roles with required skills
    return [
      {
        id: 100,
        title: "Marketing Manager",
        description: "Oversees marketing initiatives and campaigns",
        requiredSkills: ["Market Research", "Brand Strategy", "Digital Marketing", "Team Leadership", "Content Strategy", "Marketing Analytics", "Budget Management", "Social Media Marketing"]
      },
      {
        id: 101,
        title: "Brand Manager",
        description: "Develops and maintains brand identity and strategy",
        requiredSkills: ["Brand Strategy", "Market Research", "Brand Guidelines", "Product Positioning", "Consumer Insights", "Brand Analytics", "Campaign Management", "Competitor Analysis"]
      },
      {
        id: 102,
        title: "Digital Marketing Specialist",
        description: "Implements digital marketing campaigns across platforms",
        requiredSkills: ["SEO", "SEM", "Social Media Marketing", "Content Creation", "Email Marketing", "Analytics", "PPC Advertising", "CRM Systems"]
      },
      {
        id: 103,
        title: "Social Media Manager",
        description: "Manages social media presence and engagement",
        requiredSkills: ["Social Media Platforms", "Content Creation", "Community Management", "Social Media Analytics", "Visual Design", "Copywriting", "Trend Analysis", "Crisis Management"]
      },
      {
        id: 104,
        title: "Content Marketing Manager",
        description: "Creates and distributes valuable content",
        requiredSkills: ["Content Strategy", "SEO", "Editorial Planning", "Storytelling", "Analytics", "Audience Development", "Content Distribution", "Brand Voice"]
      },
      {
        id: 200,
        title: "Software Engineer",
        description: "Develops software applications and systems",
        requiredSkills: ["Programming Languages", "Data Structures", "Algorithms", "Software Design", "Version Control", "Testing", "Problem Solving", "Debugging"]
      },
      {
        id: 201,
        title: "Data Scientist",
        description: "Extracts insights from complex data",
        requiredSkills: ["Statistics", "Machine Learning", "Python", "R", "Data Visualization", "SQL", "Feature Engineering", "Data Cleaning"]
      },
      {
        id: 202,
        title: "Product Manager",
        description: "Guides product development and strategy",
        requiredSkills: ["Product Strategy", "User Research", "Market Analysis", "Roadmapping", "Cross-functional Collaboration", "Prototyping", "Agile Methodologies", "Stakeholder Management"]
      },
      {
        id: 300,
        title: "Financial Analyst",
        description: "Analyzes financial data and makes recommendations",
        requiredSkills: ["Financial Modeling", "Excel", "Financial Statement Analysis", "Forecasting", "Valuation", "Industry Research", "Data Analysis", "Presentation Skills"]
      },
      {
        id: 301,
        title: "Risk Analyst",
        description: "Identifies and assesses financial risks",
        requiredSkills: ["Risk Assessment", "Statistical Modeling", "Financial Analysis", "Regulatory Compliance", "Credit Analysis", "Market Analysis", "Scenario Planning", "Reporting"]
      }
    ];
  }
}

// Database implementation of the storage interface
export class DatabaseStorage implements IStorage {
  // Interview role methods
  async getInterviewRole(id: number): Promise<InterviewRole | undefined> {
    const [role] = await db.select().from(interviewRoles).where(eq(interviewRoles.id, id));
    return role;
  }

  async getInterviewRoleByTitle(title: string): Promise<InterviewRole | undefined> {
    const [role] = await db.select().from(interviewRoles).where(eq(interviewRoles.title, title));
    return role;
  }

  async getAllInterviewRoles(): Promise<InterviewRole[]> {
    return await db.select().from(interviewRoles);
  }

  async getInterviewRolesByIndustry(industry: string): Promise<InterviewRole[]> {
    return await db.select().from(interviewRoles).where(eq(interviewRoles.industry, industry));
  }

  async getInterviewRolesByLevel(level: string): Promise<InterviewRole[]> {
    return await db.select().from(interviewRoles).where(eq(interviewRoles.level, level));
  }

  async createInterviewRole(role: InsertInterviewRole): Promise<InterviewRole> {
    const [createdRole] = await db.insert(interviewRoles).values(role).returning();
    return createdRole;
  }

  async updateInterviewRole(id: number, roleData: Partial<InsertInterviewRole>): Promise<InterviewRole | undefined> {
    const [updatedRole] = await db.update(interviewRoles)
      .set(roleData)
      .where(eq(interviewRoles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteInterviewRole(id: number): Promise<boolean> {
    const result = await db.delete(interviewRoles).where(eq(interviewRoles.id, id));
    return result.rowCount ? true : false;
  }

  // Interview question methods
  async getInterviewQuestion(id: number): Promise<InterviewQuestion | undefined> {
    const [question] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id));
    return question;
  }

  async getInterviewQuestionsByRole(roleId: number): Promise<InterviewQuestion[]> {
    return await db.select().from(interviewQuestions).where(eq(interviewQuestions.roleId, roleId));
  }

  async getInterviewQuestionsByCategory(category: string): Promise<InterviewQuestion[]> {
    return await db.select().from(interviewQuestions).where(eq(interviewQuestions.category, category));
  }

  async getInterviewQuestionsByDifficulty(difficulty: string): Promise<InterviewQuestion[]> {
    return await db.select().from(interviewQuestions).where(eq(interviewQuestions.difficulty, difficulty));
  }

  async getInterviewQuestionsBySkill(skillId: number): Promise<InterviewQuestion[]> {
    // This is more complex as we need to check if the skill ID is in the array of related skills
    // For a simplistic approach, we'll just return all questions
    // In a real implementation, you would use a more sophisticated query
    return await db.select().from(interviewQuestions);
  }

  async createInterviewQuestion(question: InsertInterviewQuestion): Promise<InterviewQuestion> {
    const [createdQuestion] = await db.insert(interviewQuestions).values(question).returning();
    return createdQuestion;
  }

  async updateInterviewQuestion(id: number, questionData: Partial<InsertInterviewQuestion>): Promise<InterviewQuestion | undefined> {
    const [updatedQuestion] = await db.update(interviewQuestions)
      .set(questionData)
      .where(eq(interviewQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteInterviewQuestion(id: number): Promise<boolean> {
    const result = await db.delete(interviewQuestions).where(eq(interviewQuestions.id, id));
    return result.rowCount ? true : false;
  }

  // Interview session methods
  async getInterviewSession(id: number): Promise<InterviewSession | undefined> {
    const [session] = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id));
    return session;
  }

  async getInterviewSessionsByUserId(userId: number): Promise<InterviewSession[]> {
    return await db.select().from(interviewSessions).where(eq(interviewSessions.userId, userId));
  }

  async getInterviewSessionsByRole(roleId: number): Promise<InterviewSession[]> {
    return await db.select().from(interviewSessions).where(eq(interviewSessions.roleId, roleId));
  }

  async createInterviewSession(session: InsertInterviewSession): Promise<InterviewSession> {
    const [createdSession] = await db.insert(interviewSessions).values(session).returning();
    return createdSession;
  }

  async updateInterviewSession(id: number, sessionData: Partial<InsertInterviewSession>): Promise<InterviewSession | undefined> {
    const [updatedSession] = await db.update(interviewSessions)
      .set(sessionData)
      .where(eq(interviewSessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteInterviewSession(id: number): Promise<boolean> {
    const result = await db.delete(interviewSessions).where(eq(interviewSessions.id, id));
    return result.rowCount ? true : false;
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    console.log("DatabaseStorage.getUserByUsername called with:", username);
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      console.log("getUserByUsername result:", user || "No user found");
      return user || undefined;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log("DatabaseStorage.getUserByEmail called with:", email);
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      console.log("getUserByEmail result:", user || "No user found");
      return user || undefined;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      throw error;
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
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
  
  async getLatestCareerGoalByUserId(userId: number): Promise<CareerGoal | undefined> {
    const [latestGoal] = await db.select()
      .from(careerGoals)
      .where(eq(careerGoals.userId, userId))
      .orderBy(desc(careerGoals.id))
      .limit(1);
    return latestGoal;
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

  async getUserSkillBySkillId(userId: number, skillId: number): Promise<UserSkill | undefined> {
    const [userSkill] = await db
      .select()
      .from(userSkills)
      .where(
        and(
          eq(userSkills.userId, userId),
          eq(userSkills.skillId, skillId)
        )
      );
    return userSkill;
  }

  async createUserSkill(userSkill: InsertUserSkill): Promise<UserSkill> {
    const [newUserSkill] = await db.insert(userSkills).values(userSkill).returning();
    return newUserSkill;
  }

  async updateUserSkill(idOrUserId: number, userSkillDataOrSkillId: Partial<InsertUserSkill> | number, userSkillData?: Partial<InsertUserSkill>): Promise<UserSkill | undefined> {
    // First overload: updateUserSkill(id, userSkillData)
    if (typeof userSkillDataOrSkillId !== 'number') {
      const id = idOrUserId;
      const [updatedUserSkill] = await db.update(userSkills)
        .set(userSkillDataOrSkillId)
        .where(eq(userSkills.id, id))
        .returning();
      return updatedUserSkill;
    } 
    // Second overload: updateUserSkill(userId, skillId, userSkillData)
    else {
      const userId = idOrUserId;
      const skillId = userSkillDataOrSkillId;
      
      if (!userSkillData) return undefined;
      
      const [updatedUserSkill] = await db.update(userSkills)
        .set(userSkillData)
        .where(
          and(
            eq(userSkills.userId, userId),
            eq(userSkills.skillId, skillId)
          )
        )
        .returning();
      return updatedUserSkill;
    }
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

  // Career path methods
  async getCareerPath(id: number): Promise<CareerPath | undefined> {
    const [path] = await db.select().from(careerPaths).where(eq(careerPaths.id, id));
    return path;
  }

  async getAllCareerPaths(): Promise<CareerPath[]> {
    return await db.select().from(careerPaths);
  }

  async getCareerPathByRoleId(roleId: number): Promise<CareerPath | undefined> {
    const [path] = await db.select().from(careerPaths).where(eq(careerPaths.roleId, roleId));
    return path;
  }

  async createCareerPath(path: InsertCareerPath): Promise<CareerPath> {
    const [createdPath] = await db.insert(careerPaths).values(path).returning();
    return createdPath;
  }

  async updateCareerPath(id: number, pathData: Partial<InsertCareerPath>): Promise<CareerPath | undefined> {
    const [updatedPath] = await db.update(careerPaths)
      .set(pathData)
      .where(eq(careerPaths.id, id))
      .returning();
    return updatedPath;
  }

  async deleteCareerPath(id: number): Promise<boolean> {
    const result = await db.delete(careerPaths).where(eq(careerPaths.id, id));
    return result.rowCount > 0;
  }
  
  // Role methods - same implementation as MemStorage for consistency
  async getRoles(): Promise<any[]> {
    // Predefined roles with required skills
    return [
      {
        id: 100,
        title: "Marketing Manager",
        description: "Oversees marketing initiatives and campaigns",
        requiredSkills: ["Market Research", "Brand Strategy", "Digital Marketing", "Team Leadership", "Content Strategy", "Marketing Analytics", "Budget Management", "Social Media Marketing"]
      },
      {
        id: 101,
        title: "Brand Manager",
        description: "Develops and maintains brand identity and strategy",
        requiredSkills: ["Brand Strategy", "Market Research", "Brand Guidelines", "Product Positioning", "Consumer Insights", "Brand Analytics", "Campaign Management", "Competitor Analysis"]
      },
      {
        id: 102,
        title: "Digital Marketing Specialist",
        description: "Implements digital marketing campaigns across platforms",
        requiredSkills: ["SEO", "SEM", "Social Media Marketing", "Content Creation", "Email Marketing", "Analytics", "PPC Advertising", "CRM Systems"]
      },
      {
        id: 103,
        title: "Social Media Manager",
        description: "Manages social media presence and engagement",
        requiredSkills: ["Social Media Platforms", "Content Creation", "Community Management", "Social Media Analytics", "Visual Design", "Copywriting", "Trend Analysis", "Crisis Management"]
      },
      {
        id: 104,
        title: "Content Marketing Manager",
        description: "Creates and distributes valuable content",
        requiredSkills: ["Content Strategy", "SEO", "Editorial Planning", "Storytelling", "Analytics", "Audience Development", "Content Distribution", "Brand Voice"]
      },
      {
        id: 200,
        title: "Software Engineer",
        description: "Develops software applications and systems",
        requiredSkills: ["Programming Languages", "Data Structures", "Algorithms", "Software Design", "Version Control", "Testing", "Problem Solving", "Debugging"]
      },
      {
        id: 201,
        title: "Data Scientist",
        description: "Extracts insights from complex data",
        requiredSkills: ["Statistics", "Machine Learning", "Python", "R", "Data Visualization", "SQL", "Feature Engineering", "Data Cleaning"]
      },
      {
        id: 202,
        title: "Product Manager",
        description: "Guides product development and strategy",
        requiredSkills: ["Product Strategy", "User Research", "Market Analysis", "Roadmapping", "Cross-functional Collaboration", "Prototyping", "Agile Methodologies", "Stakeholder Management"]
      },
      {
        id: 300,
        title: "Financial Analyst",
        description: "Analyzes financial data and makes recommendations",
        requiredSkills: ["Financial Modeling", "Excel", "Financial Statement Analysis", "Forecasting", "Valuation", "Industry Research", "Data Analysis", "Presentation Skills"]
      },
      {
        id: 301,
        title: "Risk Analyst",
        description: "Identifies and assesses financial risks",
        requiredSkills: ["Risk Assessment", "Statistical Modeling", "Financial Analysis", "Regulatory Compliance", "Credit Analysis", "Market Analysis", "Scenario Planning", "Reporting"]
      }
    ];
  }
  
  // User resource progress methods
  async getUserResourceProgress(id: number): Promise<UserResourceProgress | undefined> {
    const [progress] = await db.select().from(userResourceProgress).where(eq(userResourceProgress.id, id));
    return progress;
  }
  
  async getUserResourceProgressByUserId(userId: number): Promise<UserResourceProgress[]> {
    return db.select().from(userResourceProgress).where(eq(userResourceProgress.userId, userId));
  }
  
  async getUserResourceProgressByResourceId(resourceId: number): Promise<UserResourceProgress[]> {
    return db.select().from(userResourceProgress).where(eq(userResourceProgress.resourceId, resourceId));
  }
  
  async getUserResourceProgressByUserAndResource(userId: number, resourceId: number): Promise<UserResourceProgress | undefined> {
    const [progress] = await db.select().from(userResourceProgress)
      .where(and(
        eq(userResourceProgress.userId, userId),
        eq(userResourceProgress.resourceId, resourceId)
      ));
    return progress;
  }
  
  async createUserResourceProgress(progress: InsertUserResourceProgress): Promise<UserResourceProgress> {
    const [newProgress] = await db.insert(userResourceProgress).values(progress).returning();
    
    // Create activity record for the completion
    await this.createUserActivity({
      userId: progress.userId,
      activityType: 'completed_resource',
      description: 'Completed a learning resource',
      metadata: { resourceId: progress.resourceId }
    });
    
    return newProgress;
  }
  
  async updateUserResourceProgress(id: number, progressData: Partial<InsertUserResourceProgress>): Promise<UserResourceProgress | undefined> {
    const [updatedProgress] = await db.update(userResourceProgress)
      .set(progressData)
      .where(eq(userResourceProgress.id, id))
      .returning();
    return updatedProgress;
  }
  
  async deleteUserResourceProgress(id: number): Promise<boolean> {
    const result = await db.delete(userResourceProgress).where(eq(userResourceProgress.id, id));
    return result.rowCount > 0;
  }
  
  async calculateUserProgressStats(userId: number): Promise<{ 
    overallPercent: number, 
    skills: Array<{
      skillId: number,
      skillName: string,
      completed: number,
      total: number,
      percent: number
    }> 
  }> {
    // Get all the user's completed resources
    const completedResources = await this.getUserResourceProgressByUserId(userId);
    
    // Get all learning resources
    const allResources = await this.getAllLearningResources();
    
    // Get all skills for this user
    const userSkills = await this.getUserSkillsByUserId(userId);
    
    // Get skill details to map IDs to names
    const skillDetails = await this.getAllSkills();
    const skillMap = new Map(skillDetails.map(skill => [skill.id, skill]));
    
    // Create a map of skill IDs to resource counts and completions
    const skillStats = new Map<number, { completed: number, total: number, skillName: string }>();
    
    // Initialize skill stats for all user skills
    userSkills.forEach(userSkill => {
      const skill = skillMap.get(userSkill.skillId);
      if (skill) {
        skillStats.set(userSkill.skillId, {
          completed: 0,
          total: 0,
          skillName: skill.name
        });
      }
    });
    
    // Track which resources are completed
    const completedResourceIds = new Set(completedResources.map(res => res.resourceId));
    
    // Analyze all resources to count them by skill
    allResources.forEach(resource => {
      // Skip resources with no skill IDs
      if (!resource.skillIds || resource.skillIds.length === 0) return;
      
      // For each skill that this resource maps to
      resource.skillIds.forEach(skillIdStr => {
        const skillId = parseInt(skillIdStr, 10);
        
        // Only count resources for skills the user has
        if (skillStats.has(skillId)) {
          const stats = skillStats.get(skillId)!;
          stats.total += 1;
          
          // If the resource is completed, increment the completed count
          if (completedResourceIds.has(resource.id)) {
            stats.completed += 1;
          }
          
          skillStats.set(skillId, stats);
        }
      });
    });
    
    // Calculate percentages and format the output
    let totalCompleted = 0;
    let totalResources = 0;
    
    const skills = Array.from(skillStats.entries()).map(([skillId, stats]) => {
      totalCompleted += stats.completed;
      totalResources += stats.total;
      
      const percent = stats.total > 0 
        ? Math.round((stats.completed / stats.total) * 100) 
        : 0;
        
      return {
        skillId,
        skillName: stats.skillName,
        completed: stats.completed,
        total: stats.total,
        percent
      };
    });
    
    // Calculate overall percentage
    const overallPercent = totalResources > 0 
      ? Math.round((totalCompleted / totalResources) * 100) 
      : 0;
    
    return {
      overallPercent,
      skills: skills.sort((a, b) => b.percent - a.percent) // Sort by highest percentage first
    };
  }
}

// Switch from in-memory storage to database storage
export const storage = new DatabaseStorage();
