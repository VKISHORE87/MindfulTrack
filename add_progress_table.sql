CREATE TABLE IF NOT EXISTS user_resource_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  resource_id INTEGER NOT NULL REFERENCES learning_resources(id),
  completed_at TIMESTAMP DEFAULT NOW(),
  rating INTEGER,
  feedback TEXT,
  time_spent_minutes INTEGER
);