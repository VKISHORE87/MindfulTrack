CREATE TABLE "career_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"timeline_months" integer NOT NULL,
	"target_date" timestamp,
	"target_role_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "career_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"previous_role" text,
	"next_role" text,
	"years_to_progress" integer,
	"skills_to_acquire" text[],
	"typical_transition_path" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"question" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"expected_answer_points" text[],
	"sample_answer" text,
	"related_skill_ids" text[]
);
--> statement-breakpoint
CREATE TABLE "interview_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"required_skills" text[],
	"required_skill_levels" json DEFAULT '{}'::json,
	"industry" text NOT NULL,
	"level" text NOT NULL,
	"role_type" text NOT NULL,
	"average_salary" numeric,
	"growth_rate" numeric,
	"demand_score" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "interview_roles_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"session_date" timestamp DEFAULT now(),
	"feedback" text,
	"performance" integer NOT NULL,
	"notes" text,
	"question_ids" text[],
	"answers" json
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"modules" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"resource_type" text NOT NULL,
	"url" text,
	"duration_minutes" integer,
	"provider" text,
	"skill_ids" text[]
);
--> statement-breakpoint
CREATE TABLE "skill_validations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"validation_type" text NOT NULL,
	"score" integer,
	"validated_at" timestamp DEFAULT now(),
	"evidence" text,
	"validated_by" integer
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"progress" integer NOT NULL,
	"completed" boolean DEFAULT false,
	"score" integer,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"current_level" integer NOT NULL,
	"target_level" integer NOT NULL,
	"notes" text,
	"last_assessed" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"name" text NOT NULL,
	"role" text,
	"email" text NOT NULL,
	"google_id" text,
	"profile_picture" text,
	"reset_password_token" text,
	"reset_password_expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_reset_password_token_unique" UNIQUE("reset_password_token")
);
--> statement-breakpoint
ALTER TABLE "career_goals" ADD CONSTRAINT "career_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_goals" ADD CONSTRAINT "career_goals_target_role_id_interview_roles_id_fk" FOREIGN KEY ("target_role_id") REFERENCES "public"."interview_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_paths" ADD CONSTRAINT "career_paths_role_id_interview_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."interview_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_role_id_interview_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."interview_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_role_id_interview_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."interview_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_validations" ADD CONSTRAINT "skill_validations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_validations" ADD CONSTRAINT "skill_validations_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_resource_id_learning_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."learning_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;