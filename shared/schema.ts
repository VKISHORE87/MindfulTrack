import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Can be null for Google sign-in
  name: text("name").notNull(),
  role: text("role"),
  email: text("email").notNull().unique(),
  googleId: text("google_id").unique(),
  profilePicture: text("profile_picture"),
  resetPasswordToken: text("reset_password_token").unique(),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").defaultNow()
});

// Career goal model
export const careerGoals = pgTable("career_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  timelineMonths: integer("timeline_months").notNull(),
  targetDate: timestamp("target_date"),
  currentRoleId: integer("current_role_id").references(() => interviewRoles.id),
  targetRoleId: integer("target_role_id").references(() => interviewRoles.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Skills model
export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  description: text("description")
});

// User skills model (with gap analysis)
export const userSkills = pgTable("user_skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  currentLevel: integer("current_level").notNull(), // 0-100
  targetLevel: integer("target_level").notNull(), // 0-100
  notes: text("notes"),
  lastAssessed: timestamp("last_assessed").defaultNow()
});

// Learning resources model
export const learningResources = pgTable("learning_resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(), // e.g., 'video', 'course', 'documentation', 'practice', 'book'
  url: text("url"),
  duration: integer("duration_minutes"), // in minutes
  provider: text("provider"),
  skillIds: text("skill_ids").array(), // Array of skill IDs this resource helps develop
  difficulty: text("difficulty"), // 'beginner', 'intermediate', 'advanced'
  rating: decimal("rating", { precision: 2, scale: 1 }), // 0.0 to 5.0
  isFree: boolean("is_free").default(true),
  prerequisites: text("prerequisites").array(), // Array of prerequisite skills
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Learning path model
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  modules: json("modules").notNull() // JSON structure with modules and their resources
});

// User progress on learning resources
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  resourceId: integer("resource_id").notNull().references(() => learningResources.id),
  progress: integer("progress").notNull(), // percentage 0-100
  completed: boolean("completed").default(false),
  score: integer("score"), // if applicable
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// User activities
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  activityType: text("activity_type").notNull(), // e.g., 'completed_resource', 'updated_skill', etc.
  description: text("description").notNull(),
  metadata: json("metadata"), // Additional data about the activity
  createdAt: timestamp("created_at").defaultNow()
});

// Skill validations
export const skillValidations = pgTable("skill_validations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  validationType: text("validation_type").notNull(), // e.g., 'assessment', 'project', 'certification'
  score: integer("score"),
  validatedAt: timestamp("validated_at").defaultNow(),
  evidence: text("evidence"), // URL or reference to evidence
  validatedBy: integer("validated_by") // Optional validator (could be another user or system)
});

// User resource progress for tracking completed learning resources
export const userResourceProgress = pgTable("user_resource_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  resourceId: integer("resource_id").notNull().references(() => learningResources.id),
  completedAt: timestamp("completed_at").defaultNow(),
  rating: integer("rating"), // Optional user rating (1-5)
  feedback: text("feedback"), // Optional user feedback
  timeSpentMinutes: integer("time_spent_minutes"), // Optional tracking of time spent
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  email: true,
  googleId: true,
  profilePicture: true,
  resetPasswordToken: true,
  resetPasswordExpires: true
});

export const insertCareerGoalSchema = createInsertSchema(careerGoals).pick({
  userId: true,
  title: true,
  description: true,
  timelineMonths: true,
  targetDate: true,
  currentRoleId: true,
  targetRoleId: true
});

export const insertSkillSchema = createInsertSchema(skills).pick({
  name: true,
  category: true,
  description: true
});

export const insertUserSkillSchema = createInsertSchema(userSkills).pick({
  userId: true,
  skillId: true,
  currentLevel: true,
  targetLevel: true,
  notes: true
});

export const insertLearningResourceSchema = createInsertSchema(learningResources).pick({
  title: true,
  description: true,
  resourceType: true,
  url: true,
  duration: true,
  provider: true,
  skillIds: true,
  difficulty: true,
  rating: true,
  isFree: true,
  prerequisites: true
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).pick({
  userId: true,
  title: true,
  description: true,
  modules: true
});

export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  resourceId: true,
  progress: true,
  completed: true,
  score: true,
  startedAt: true,
  completedAt: true
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick({
  userId: true,
  activityType: true,
  description: true,
  metadata: true
});

export const insertSkillValidationSchema = createInsertSchema(skillValidations).pick({
  userId: true,
  skillId: true,
  validationType: true,
  score: true,
  evidence: true,
  validatedBy: true
});

export const insertUserResourceProgressSchema = createInsertSchema(userResourceProgress).pick({
  userId: true,
  resourceId: true,
  rating: true,
  feedback: true,
  timeSpentMinutes: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCareerGoal = z.infer<typeof insertCareerGoalSchema>;
export type CareerGoal = typeof careerGoals.$inferSelect;

export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;

export type InsertUserSkill = z.infer<typeof insertUserSkillSchema>;
export type UserSkill = typeof userSkills.$inferSelect;

export type InsertLearningResource = z.infer<typeof insertLearningResourceSchema>;
export type LearningResource = typeof learningResources.$inferSelect;

export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivities.$inferSelect;

export type InsertSkillValidation = z.infer<typeof insertSkillValidationSchema>;
export type SkillValidation = typeof skillValidations.$inferSelect;

export type InsertUserResourceProgress = z.infer<typeof insertUserResourceProgressSchema>;
export type UserResourceProgress = typeof userResourceProgress.$inferSelect;

// Extended types for the frontend
export const skillCategorySchema = z.enum([
  "technical",
  "leadership",
  "communication",
  "analytical",
  "creative",
  "management",
  "business",
  "marketing",
  "sales",
  "design",
  "finance",
  "healthcare",
  "education",
  "legal",
  "human_resources",
  "operations",
  "product_management",
  "customer_service",
  "research",
  "consulting"
]);

export const resourceTypeSchema = z.enum([
  "course",
  "workshop",
  "assessment",
  "video",
  "article",
  "book",
  "project"
]);

export const activityTypeSchema = z.enum([
  "completed_resource",
  "started_resource",
  "updated_skill",
  "validated_skill",
  "set_career_goal"
]);

export const validationTypeSchema = z.enum([
  "assessment",
  "project",
  "certification",
  "peer_review",
  "self_assessment"
]);

// Interview Preparation
export const interviewRoles = pgTable("interview_roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  description: text("description"),
  requiredSkills: text("required_skills").array(),
  requiredSkillLevels: json("required_skill_levels").default({}), // Object mapping skill name to required proficiency level (0-100)
  industry: text("industry").notNull(),
  level: text("level").notNull(), // junior, mid, senior
  roleType: text("role_type").notNull(), // technical, business, creative, etc.
  averageSalary: decimal("average_salary"), // Average salary for this role
  growthRate: decimal("growth_rate"), // Estimated annual growth rate (%)
  demandScore: integer("demand_score"), // Demand score on a scale of 1-10
  createdAt: timestamp("created_at").defaultNow()
});

// Career paths to show progression options
export const careerPaths = pgTable("career_paths", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => interviewRoles.id, { onDelete: 'cascade' }),
  previousRole: text("previous_role"),
  nextRole: text("next_role"),
  yearsToProgress: integer("years_to_progress"),
  skillsToAcquire: text("skills_to_acquire").array(),
  typicalTransitionPath: text("typical_transition_path"),
  createdAt: timestamp("created_at").defaultNow()
});

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => interviewRoles.id),
  question: text("question").notNull(),
  category: text("category").notNull(), // technical, behavioral, scenario-based
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  expectedAnswerPoints: text("expected_answer_points").array(),
  sampleAnswer: text("sample_answer"),
  relatedSkillIds: text("related_skill_ids").array()
});

export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  roleId: integer("role_id").notNull().references(() => interviewRoles.id),
  sessionDate: timestamp("session_date").defaultNow(),
  feedback: text("feedback"),
  performance: integer("performance").notNull(), // 0-100
  notes: text("notes"),
  questionIds: text("question_ids").array(),
  answers: json("answers") // {questionId: string, answer: string, score: number}[]
});

// Insert schemas
export const insertInterviewRoleSchema = createInsertSchema(interviewRoles).omit({
  id: true,
  createdAt: true
});

export const insertCareerPathSchema = createInsertSchema(careerPaths).pick({
  roleId: true,
  previousRole: true,
  nextRole: true,
  yearsToProgress: true,
  skillsToAcquire: true,
  typicalTransitionPath: true
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestions).pick({
  roleId: true,
  question: true,
  category: true,
  difficulty: true,
  expectedAnswerPoints: true,
  sampleAnswer: true,
  relatedSkillIds: true
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).pick({
  userId: true,
  roleId: true,
  sessionDate: true,
  feedback: true,
  performance: true,
  notes: true,
  questionIds: true,
  answers: true
});

// Types
export type InsertInterviewRole = z.infer<typeof insertInterviewRoleSchema>;
export type InterviewRole = typeof interviewRoles.$inferSelect;

export type InsertCareerPath = z.infer<typeof insertCareerPathSchema>;
export type CareerPath = typeof careerPaths.$inferSelect;

export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;

export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;

export const industrySchema = z.enum([
  "technology",
  "healthcare",
  "finance",
  "education",
  "manufacturing",
  "retail",
  "government",
  "nonprofit",
  "media",
  "entertainment",
  "hospitality",
  "real_estate",
  "legal",
  "consulting",
  "transportation",
  "energy",
  "agriculture",
  "construction",
  "pharmaceutical",
  "telecommunications"
]);

export const interviewQuestionCategorySchema = z.enum([
  "technical",
  "behavioral",
  "scenario",
  "system_design",
  "coding",
  "domain_knowledge",
  "role_specific",
  "industry_knowledge",
  "leadership",
  "problem_solving",
  "communication"
]);

export const interviewDifficultySchema = z.enum([
  "easy",
  "medium",
  "hard"
]);

export const careerLevelSchema = z.enum([
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "vp",
  "c_level",
  "associate",
  "specialist",
  "coordinator",
  "analyst",
  "consultant",
  "advisor"
]);

export const roleTypeSchema = z.enum([
  "technical", // software engineer, data scientist, etc.
  "creative", // designer, writer, artist, etc.
  "business", // business analyst, product manager, etc.
  "leadership", // manager, director, etc.
  "operations", // operations manager, logistics, etc.
  "customer_facing", // sales, customer support, etc.
  "healthcare", // nurse, doctor, therapist, etc.
  "education", // teacher, professor, trainer, etc.
  "administrative", // administrator, coordinator, etc.
  "finance", // accountant, financial analyst, etc.
  "legal", // lawyer, paralegal, etc.
  "marketing", // marketer, brand specialist, etc.
  "research", // researcher, scientist, etc.
  "human_resources" // HR specialist, recruiter, etc.
]);

export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type ValidationType = z.infer<typeof validationTypeSchema>;
export type Industry = z.infer<typeof industrySchema>;
export type InterviewQuestionCategory = z.infer<typeof interviewQuestionCategorySchema>;
export type InterviewDifficulty = z.infer<typeof interviewDifficultySchema>;
export type CareerLevel = z.infer<typeof careerLevelSchema>;
export type RoleType = z.infer<typeof roleTypeSchema>;
