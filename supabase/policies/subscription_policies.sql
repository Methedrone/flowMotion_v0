-- Allow users to view all stories
CREATE POLICY "Allow users to view all stories"
ON public.stories
FOR SELECT
USING (true);

-- Allow users to view their own favorites
CREATE POLICY "Allow users to view their own favorites"
ON public.favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create favorites
CREATE POLICY "Allow users to create favorites"
ON public.favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own favorites
CREATE POLICY "Allow users to delete their own favorites"
ON public.favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to view their own quotes
CREATE POLICY "Allow users to view their own quotes"
ON public.quotes
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to create quotes
CREATE POLICY "Allow users to create quotes"
ON public.quotes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own quotes
CREATE POLICY "Allow users to delete their own quotes"
ON public.quotes
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to view their own subscriptions
CREATE POLICY "Allow users to view their own subscriptions"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id uuid)
RETURNS boolean AS $$
DECLARE
  has_subscription boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE 
      subscriptions.user_id = $1
      AND (
        status = 'active' 
        OR (
          status = 'trialing' 
          AND trial_end > NOW()
        )
      )
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow access to premium content only for users with active subscriptions
CREATE POLICY "Allow premium content access for subscribers"
ON public.stories
FOR SELECT
USING (
  NOT premium 
  OR 
  public.has_active_subscription(auth.uid())
);
