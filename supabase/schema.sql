-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.key_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, story_id)
);

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL,
  plan TEXT NOT NULL,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.storyboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Analytics tables
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  device_id TEXT,
  device_model TEXT,
  os_name TEXT,
  os_version TEXT,
  app_version TEXT,
  properties JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  dau INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  story_views INTEGER DEFAULT 0,
  story_completions INTEGER DEFAULT 0,
  avg_session_duration_seconds FLOAT DEFAULT 0,
  subscription_conversions INTEGER DEFAULT 0,
  subscription_cancellations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily_metrics ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own user data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- All authenticated users can read stories
CREATE POLICY "Authenticated users can view stories" ON public.stories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only read key_points if they have an active subscription
CREATE POLICY "Users with subscription can view key points" ON public.key_points
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE 
          user_id = auth.uid() AND 
          status = 'active' AND 
          current_period_end > now()
      ) OR
      EXISTS (
        SELECT 1 FROM public.stories
        WHERE id = story_id AND premium = false
      )
    )
  );

-- Users can only manage their own favorites
CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- Users can only manage their own quotes
CREATE POLICY "Users can manage own quotes" ON public.quotes
  FOR ALL USING (auth.uid() = user_id);

-- Users can only read their own subscription data
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Analytics events can be inserted by authenticated users
CREATE POLICY "Users can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only service role can read analytics data
CREATE POLICY "Service role can read analytics" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read daily metrics" ON public.analytics_daily_metrics
  FOR SELECT USING (auth.role() = 'service_role');

-- Function to automatically set user_id on favorites, quotes
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for favorites
CREATE TRIGGER set_user_id_on_favorites
BEFORE INSERT ON public.favorites
FOR EACH ROW EXECUTE PROCEDURE public.set_user_id();

-- Trigger for quotes
CREATE TRIGGER set_user_id_on_quotes
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE PROCEDURE public.set_user_id();

-- Function to create a new user record when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger after a user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to aggregate daily analytics metrics
CREATE OR REPLACE FUNCTION public.aggregate_daily_metrics()
RETURNS TRIGGER AS $$
DECLARE
  event_date DATE;
  metric_exists BOOLEAN;
BEGIN
  -- Get the date from the event timestamp
  event_date := DATE(NEW.timestamp);
  
  -- Check if a record for this date already exists
  SELECT EXISTS (
    SELECT 1 FROM public.analytics_daily_metrics WHERE date = event_date
  ) INTO metric_exists;
  
  -- If no record exists, create one
  IF NOT metric_exists THEN
    INSERT INTO public.analytics_daily_metrics (date)
    VALUES (event_date);
  END IF;
  
  -- Update metrics based on event type
  IF NEW.event_type = 'app_open' THEN
    -- Increment DAU (unique users per day)
    UPDATE public.analytics_daily_metrics
    SET dau = (
      SELECT COUNT(DISTINCT user_id) 
      FROM public.analytics_events 
      WHERE DATE(timestamp) = event_date
        AND user_id IS NOT NULL
    )
    WHERE date = event_date;
    
  ELSIF NEW.event_type = 'sign_up' THEN
    -- Increment new users
    UPDATE public.analytics_daily_metrics
    SET new_users = new_users + 1
    WHERE date = event_date;
    
  ELSIF NEW.event_type = 'story_view' THEN
    -- Increment story views
    UPDATE public.analytics_daily_metrics
    SET story_views = story_views + 1
    WHERE date = event_date;
    
  ELSIF NEW.event_type = 'story_complete' THEN
    -- Increment story completions
    UPDATE public.analytics_daily_metrics
    SET story_completions = story_completions + 1
    WHERE date = event_date;
    
  ELSIF NEW.event_type = 'session_end' THEN
    -- Update average session duration
    UPDATE public.analytics_daily_metrics
    SET avg_session_duration_seconds = (
      SELECT AVG((properties->>'session_duration_seconds')::float)
      FROM public.analytics_events
      WHERE DATE(timestamp) = event_date
        AND event_type = 'session_end'
    )
    WHERE date = event_date;
    
  ELSIF NEW.event_type = 'subscription_started' THEN
    -- Increment subscription conversions
    UPDATE public.analytics_daily_metrics
    SET subscription_conversions = subscription_conversions + 1
    WHERE date = event_date;
    
  ELSIF NEW.event_type = 'subscription_canceled' THEN
    -- Increment subscription cancellations
    UPDATE public.analytics_daily_metrics
    SET subscription_cancellations = subscription_cancellations + 1
    WHERE date = event_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update daily metrics when a new analytics event is inserted
CREATE TRIGGER update_daily_metrics
AFTER INSERT ON public.analytics_events
FOR EACH ROW EXECUTE PROCEDURE public.aggregate_daily_metrics();
