-- Migration: Add gender column to users table
ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT NULL AFTER avatar_color;

-- Migration: Ensure opposite gender matching for random chat
-- (The chat model already handles this via user gender lookup)