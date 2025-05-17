-- Create table for storing user push tokens
CREATE TABLE IF NOT EXISTS user_push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, push_token)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON user_push_tokens(user_id);

-- Create table for notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_ids UUID[] NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  response JSONB
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);

-- Create RLS policies
ALTER TABLE user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read and delete their own push tokens
CREATE POLICY user_push_tokens_select_policy ON user_push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_push_tokens_insert_policy ON user_push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_push_tokens_update_policy ON user_push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_push_tokens_delete_policy ON user_push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Only service role can access notification logs
CREATE POLICY notification_logs_service_policy ON notification_logs
  USING (auth.jwt() ->> 'role' = 'service_role');
