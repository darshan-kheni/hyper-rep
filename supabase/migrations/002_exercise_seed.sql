-- Migration: 002_exercise_seed.sql
-- Description: Seed all 33 exercises from the HyperRep prototype into the exercises table.

INSERT INTO exercises (name, muscle_group, secondary_muscles, equipment, movement_type, push_pull, difficulty, instructions, tips) VALUES

-- CHEST
('Chest Press Machine', 'chest', ARRAY['triceps', 'shoulders']::TEXT[], 'machine', 'compound', 'push', 'beginner',
 'Sit with back flat against pad. Grip handles at chest height. Press forward until arms extended. Return slowly.',
 'Keep shoulder blades pinched. Don''t lock elbows fully.'),

('Incline Chest Press Machine', 'chest', ARRAY['shoulders', 'triceps']::TEXT[], 'machine', 'compound', 'push', 'beginner',
 'Adjust seat so handles are at upper chest. Press upward at incline angle.',
 'Targets upper chest. Keep wrists neutral.'),

('Dumbbell Bench Press', 'chest', ARRAY['triceps', 'shoulders']::TEXT[], 'dumbbell', 'compound', 'push', 'intermediate',
 'Lie on flat bench with dumbbell in each hand at chest level. Press up until arms extended.',
 'Greater range of motion than machine. Control the descent.'),

('Cable Crossover', 'chest', ARRAY['shoulders']::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Set cables at high position. Step forward, bring handles together in arc motion.',
 'Squeeze at the bottom. Keep slight bend in elbows.'),

('Incline Dumbbell Press', 'chest', ARRAY['shoulders', 'triceps']::TEXT[], 'dumbbell', 'compound', 'push', 'intermediate',
 'Set bench to 30-45 degree incline. Press dumbbells from upper chest to full extension overhead.',
 'Emphasizes upper chest. Don''t let elbows flare past 45 degrees.'),

-- BACK
('Seated Row Machine', 'back', ARRAY['biceps', 'rear_delts']::TEXT[], 'machine', 'compound', 'pull', 'beginner',
 'Sit with chest against pad. Pull handles toward lower chest. Squeeze shoulder blades together.',
 'Don''t lean back. Pull with elbows, not hands.'),

('Lat Pulldown', 'back', ARRAY['biceps']::TEXT[], 'cable', 'compound', 'pull', 'beginner',
 'Grip bar wider than shoulders. Pull down to upper chest. Control the return.',
 'Lean slightly back. Pull elbows down and back.'),

('Cable Row', 'back', ARRAY['biceps', 'rear_delts']::TEXT[], 'cable', 'compound', 'pull', 'intermediate',
 'Sit at cable station. Pull handle to lower chest with neutral grip.',
 'Keep torso still. Squeeze at full contraction.'),

('Wide-Grip Lat Pulldown', 'back', ARRAY['biceps', 'rear_delts']::TEXT[], 'cable', 'compound', 'pull', 'intermediate',
 'Extra wide grip on lat bar. Pull to upper chest.',
 'Emphasizes outer lats. Wider back appearance.'),

('Close-Grip Lat Pulldown', 'back', ARRAY['biceps']::TEXT[], 'cable', 'compound', 'pull', 'intermediate',
 'Use V-bar or narrow handle. Pull to mid-chest.',
 'More bicep involvement. Good for thickness.'),

-- SHOULDERS
('Shoulder Press Machine', 'shoulders', ARRAY['triceps']::TEXT[], 'machine', 'compound', 'push', 'beginner',
 'Sit with back supported. Press handles overhead until arms extended.',
 'Don''t flare elbows past 45 degrees. Full lockout at top.'),

('Dumbbell Shoulder Press', 'shoulders', ARRAY['triceps', 'core']::TEXT[], 'dumbbell', 'compound', 'push', 'intermediate',
 'Sit on bench with back support. Press dumbbells overhead from shoulder height.',
 'More stabilizer activation than machine. Keep core tight.'),

('Lateral Raise Machine', 'shoulders', ARRAY[]::TEXT[], 'machine', 'isolation', 'push', 'beginner',
 'Sit in machine. Raise pads outward to shoulder height. Lower slowly.',
 'Don''t go above shoulder height. Control the negative.'),

('Cable Lateral Raise', 'shoulders', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Stand sideways to cable. Raise arm out to side to shoulder height.',
 'Constant tension throughout range. Go light.'),

('Cable Face Pull', 'shoulders', ARRAY['rear_delts', 'upper_back']::TEXT[], 'cable', 'isolation', 'pull', 'beginner',
 'Set cable at face height. Pull rope to face, spreading ends apart. Squeeze rear delts.',
 'Best exercise for posture. Pull to forehead, not chest.'),

('Reverse Fly Machine', 'shoulders', ARRAY['upper_back']::TEXT[], 'machine', 'isolation', 'pull', 'beginner',
 'Sit facing pad. Open arms outward in reverse fly motion.',
 'Rear delt focus. Don''t use momentum.'),

('Arnold Press', 'shoulders', ARRAY['triceps']::TEXT[], 'dumbbell', 'compound', 'push', 'intermediate',
 'Start with palms facing you at chin height. Rotate and press overhead.',
 'Hits all three delt heads. Named after Arnold.'),

-- ARMS
('Bicep Curl Machine', 'arms', ARRAY[]::TEXT[], 'machine', 'isolation', 'pull', 'beginner',
 'Sit with arms on pad. Curl handles toward shoulders.',
 'Don''t swing. Slow controlled reps.'),

('Preacher Curl Machine', 'arms', ARRAY[]::TEXT[], 'machine', 'isolation', 'pull', 'beginner',
 'Arms resting on preacher pad. Curl up, lower slowly.',
 'Eliminates cheating. Great for strict form.'),

('Dumbbell Hammer Curl', 'arms', ARRAY['forearms']::TEXT[], 'dumbbell', 'isolation', 'pull', 'intermediate',
 'Hold dumbbells with neutral grip. Curl without rotating wrists.',
 'Targets brachialis and forearms. Good for arm thickness.'),

('Incline Dumbbell Curl', 'arms', ARRAY[]::TEXT[], 'dumbbell', 'isolation', 'pull', 'intermediate',
 'Sit on incline bench. Let arms hang. Curl up.',
 'Full stretch at bottom. Great for long head of bicep.'),

('EZ Bar Curl', 'arms', ARRAY['forearms']::TEXT[], 'barbell', 'isolation', 'pull', 'intermediate',
 'Grip EZ bar at angled portions. Curl to chest.',
 'Easier on wrists than straight bar.'),

('Tricep Pushdown', 'arms', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'beginner',
 'Grip bar or rope at cable station. Push down until arms straight. Elbows locked at sides.',
 'Don''t flare elbows. Squeeze at full extension.'),

('Tricep Rope Pushdown', 'arms', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Use rope attachment. Push down and spread rope apart at bottom.',
 'Extra lateral head activation from the spread.'),

('Tricep Dip Machine', 'arms', ARRAY['chest']::TEXT[], 'machine', 'compound', 'push', 'beginner',
 'Grip handles. Push down until arms extended.',
 'Keep torso upright for tricep focus.'),

('Cable Overhead Tricep Extension', 'arms', ARRAY[]::TEXT[], 'cable', 'isolation', 'push', 'intermediate',
 'Face away from cable. Extend rope overhead.',
 'Great stretch on long head of tricep.'),

-- LEGS
('Leg Press', 'legs', ARRAY['glutes']::TEXT[], 'machine', 'compound', NULL, 'beginner',
 'Sit in machine. Feet shoulder-width on platform. Press until legs nearly straight. Return slowly.',
 'Don''t lock knees. Push through heels.'),

('Leg Extension', 'legs', ARRAY[]::TEXT[], 'machine', 'isolation', NULL, 'beginner',
 'Sit in machine. Extend legs until straight. Squeeze quads. Lower slowly.',
 'Don''t use momentum. Squeeze hard at top.'),

('Leg Curl', 'legs', ARRAY[]::TEXT[], 'machine', 'isolation', NULL, 'beginner',
 'Lie face down or sit. Curl pad toward glutes. Control the return.',
 'Focus on hamstrings. Don''t let weight snap back.'),

('Hip Adductor', 'legs', ARRAY[]::TEXT[], 'machine', 'isolation', NULL, 'beginner',
 'Sit in machine. Squeeze legs inward against pads.',
 'Inner thigh focus. Go slow.'),

('Calf Raises', 'legs', ARRAY[]::TEXT[], 'bodyweight', 'isolation', NULL, 'beginner',
 'Stand on edge of step. Rise up on toes. Lower below step height.',
 'Full range of motion. Pause at top.'),

('Goblet Squat', 'legs', ARRAY['glutes', 'core']::TEXT[], 'dumbbell', 'compound', NULL, 'intermediate',
 'Hold dumbbell at chest. Squat to parallel. Drive up through heels.',
 'Teaches proper squat pattern. Keep chest up.'),

-- CORE / OTHER
('Plank', 'core', ARRAY['shoulders']::TEXT[], 'bodyweight', 'isolation', NULL, 'beginner',
 'Forearms on ground. Body in straight line. Hold position.',
 'Squeeze glutes. Don''t let hips sag or pike up.'),

('Pushups', 'chest', ARRAY['triceps', 'shoulders', 'core']::TEXT[], 'bodyweight', 'compound', 'push', 'beginner',
 'Hands shoulder-width. Lower chest to floor. Push back up.',
 'Full range every rep. Keep core tight throughout.');
