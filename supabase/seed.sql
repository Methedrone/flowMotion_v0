-- Insert sample stories
INSERT INTO public.stories (id, title, description, video_url, thumbnail_url, premium, created_at, updated_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'The Power of Habit',
    'Learn how habits work and how to change them effectively',
    'https://example.com/videos/power-of-habit.mp4',
    'https://example.com/thumbnails/power-of-habit.jpg',
    false,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Atomic Habits',
    'Small changes that lead to remarkable results',
    'https://example.com/videos/atomic-habits.mp4',
    'https://example.com/thumbnails/atomic-habits.jpg',
    true,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Deep Work',
    'Rules for focused success in a distracted world',
    'https://example.com/videos/deep-work.mp4',
    'https://example.com/thumbnails/deep-work.jpg',
    false,
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Mindfulness Meditation',
    'Techniques to reduce stress and improve focus',
    'https://example.com/videos/mindfulness.mp4',
    'https://example.com/thumbnails/mindfulness.jpg',
    true,
    NOW(),
    NOW()
  );

-- Insert sample key points
INSERT INTO public.key_points (story_id, content, order, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Habits consist of a cue, routine, and reward - understanding this loop is essential for change.',
    1,
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'To change a habit, keep the same cue and reward but change the routine.',
    2,
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'Belief is a critical component of lasting habit change.',
    3,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Small 1% improvements add up to remarkable results over time.',
    1,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Focus on building systems rather than setting goals.',
    2,
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Make good habits obvious, attractive, easy, and satisfying.',
    3,
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Deep work is the ability to focus without distraction on a cognitively demanding task.',
    1,
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Schedule your deep work sessions and protect them rigorously.',
    2,
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Embrace boredom and reduce your dependence on distracting stimuli.',
    3,
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Regular mindfulness practice can physically change your brain structure.',
    1,
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Start with just 5 minutes of daily meditation and gradually increase.',
    2,
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Mindfulness improves focus, reduces stress, and enhances emotional regulation.',
    3,
    NOW()
  );

-- Insert sample storyboards
INSERT INTO public.storyboards (story_id, content, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '{
      "title": "The Power of Habit",
      "description": "Learn how habits work and how to change them effectively",
      "scenes": [
        {
          "sceneNumber": 1,
          "narration": "Every habit follows the same pattern: a cue triggers a routine, which delivers a reward.",
          "visualDescription": "A simple animation showing a circular loop with three points labeled Cue, Routine, and Reward.",
          "duration": "10"
        },
        {
          "sceneNumber": 2,
          "narration": "To change a habit, you must keep the same cue and reward, but change the routine.",
          "visualDescription": "The same loop, but now the Routine section changes color and transforms.",
          "duration": "10"
        },
        {
          "sceneNumber": 3,
          "narration": "Belief is crucial for lasting change. Join a group where change seems possible.",
          "visualDescription": "A group of stylized figures standing together, with thought bubbles showing positive change.",
          "duration": "10"
        }
      ]
    }',
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '{
      "title": "Atomic Habits",
      "description": "Small changes that lead to remarkable results",
      "scenes": [
        {
          "sceneNumber": 1,
          "narration": "Improving by just 1% each day leads to remarkable results over time.",
          "visualDescription": "A graph showing exponential growth from small daily improvements over time.",
          "duration": "10"
        },
        {
          "sceneNumber": 2,
          "narration": "Focus on building systems rather than setting goals.",
          "visualDescription": "Split screen: one side shows a person climbing stairs (system), the other shows someone looking at a mountain peak (goal).",
          "duration": "10"
        },
        {
          "sceneNumber": 3,
          "narration": "Make good habits obvious, attractive, easy, and satisfying.",
          "visualDescription": "Four icons representing each principle, with a habit loop transforming to incorporate them.",
          "duration": "10"
        }
      ]
    }',
    NOW()
  );
