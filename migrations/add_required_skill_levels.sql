-- Add the required_skill_levels column to interview_roles table
ALTER TABLE interview_roles 
ADD COLUMN IF NOT EXISTS required_skill_levels json DEFAULT '{}'::json;