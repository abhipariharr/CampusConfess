-- Migration: Add gender column to users table
ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT NULL AFTER avatar_color;

-- Migration: Ensure opposite gender matching for random chat
-- (The chat model already handles this via user gender lookup)

-- Migration: Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('message', 'reveal_request', 'reveal_accepted', 'chat_invite') NOT NULL DEFAULT 'message',
  from_user_id INT UNSIGNED DEFAULT NULL,
  content VARCHAR(500) NOT NULL,
  link VARCHAR(255) DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;