-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: campuswhisper
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int unsigned DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_user_id` int unsigned DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT ((now() + interval 7 day)),
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_logs`
--

LOCK TABLES `admin_logs` WRITE;
/*!40000 ALTER TABLE `admin_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `sender_id` int unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_system` tinyint(1) DEFAULT '0',
  `is_flagged` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `idx_room_time` (`room_id`,`created_at`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,1,2,'hello',0,0,'2026-04-07 00:47:58'),(2,4,2,'hi',0,0,'2026-04-07 11:12:50'),(3,6,7,'hello',0,0,'2026-04-15 19:35:43'),(4,6,7,'how are you?',0,0,'2026-04-15 19:35:54');
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_participants`
--

DROP TABLE IF EXISTS `chat_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_participants` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `anon_label` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reveal_requested` tinyint(1) DEFAULT '0',
  `reveal_accepted` tinyint(1) DEFAULT '0',
  `is_blocked` tinyint(1) DEFAULT '0',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_participant` (`room_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_participants_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_participants`
--

LOCK TABLES `chat_participants` WRITE;
/*!40000 ALTER TABLE `chat_participants` DISABLE KEYS */;
INSERT INTO `chat_participants` VALUES (1,1,2,'Golden Gecko',1,0,0,'2026-04-07 00:47:55'),(2,1,3,'Shadow Crane',0,0,0,'2026-04-07 00:47:55'),(3,2,2,'Mystery Wolf',0,0,0,'2026-04-07 02:26:44'),(4,3,2,'Mystery Wolf',1,0,0,'2026-04-07 11:05:29'),(5,4,2,'Prism Bear',1,0,0,'2026-04-07 11:12:44'),(6,4,3,'Velvet Raven',0,0,0,'2026-04-07 11:12:44'),(7,5,2,'Velvet Raven',0,0,0,'2026-04-07 11:20:47'),(8,5,3,'Cosmic Otter',0,0,0,'2026-04-07 11:20:47'),(9,6,2,'Storm Hawk',0,0,0,'2026-04-15 19:35:03'),(10,6,7,'Mystery Wolf',1,1,0,'2026-04-15 19:35:33');
/*!40000 ALTER TABLE `chat_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_rooms`
--

DROP TABLE IF EXISTS `chat_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_rooms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `room_code` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_type` enum('random','interest','direct') COLLATE utf8mb4_unicode_ci DEFAULT 'random',
  `interest_tag` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `room_code` (`room_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_rooms`
--

LOCK TABLES `chat_rooms` WRITE;
/*!40000 ALTER TABLE `chat_rooms` DISABLE KEYS */;
INSERT INTO `chat_rooms` VALUES (1,'a495a93f-ec6a-41f2-889a-00063c6a053b','direct',NULL,1,'2026-04-07 00:47:55'),(2,'02529a51-da72-4833-8aee-c8b61d37e1b5','random',NULL,1,'2026-04-07 02:26:44'),(3,'2e145f8f-c411-4529-8a17-daf9d5fc1eb0','random',NULL,1,'2026-04-07 11:05:29'),(4,'82a5a341-71a6-4e93-9328-22381d791395','direct',NULL,1,'2026-04-07 11:12:44'),(5,'9288643c-3006-4b12-a3fc-442223e1cbf4','direct',NULL,1,'2026-04-07 11:20:47'),(6,'01600e2e-e5a2-4b23-be52-5566e5ac8e49','interest','music',1,'2026-04-15 19:35:03');
/*!40000 ALTER TABLE `chat_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `confession_comments`
--

DROP TABLE IF EXISTS `confession_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `confession_comments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `confession_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_flagged` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_confession` (`confession_id`),
  CONSTRAINT `confession_comments_ibfk_1` FOREIGN KEY (`confession_id`) REFERENCES `confessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `confession_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `confession_comments`
--

LOCK TABLES `confession_comments` WRITE;
/*!40000 ALTER TABLE `confession_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `confession_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `confession_likes`
--

DROP TABLE IF EXISTS `confession_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `confession_likes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `confession_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_like` (`confession_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `confession_likes_ibfk_1` FOREIGN KEY (`confession_id`) REFERENCES `confessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `confession_likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `confession_likes`
--

LOCK TABLES `confession_likes` WRITE;
/*!40000 ALTER TABLE `confession_likes` DISABLE KEYS */;
INSERT INTO `confession_likes` VALUES (2,1,1,'2026-04-07 12:49:42'),(3,9,1,'2026-04-07 12:49:43');
/*!40000 ALTER TABLE `confession_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `confessions`
--

DROP TABLE IF EXISTS `confessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `confessions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `is_flagged` tinyint(1) DEFAULT '0',
  `like_count` int unsigned DEFAULT '0',
  `comment_count` int unsigned DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_likes` (`like_count`),
  CONSTRAINT `confessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `confessions`
--

LOCK TABLES `confessions` WRITE;
/*!40000 ALTER TABLE `confessions` DISABLE KEYS */;
INSERT INTO `confessions` VALUES (1,2,'I cried during the biology exam because I realized I actually understood everything for the first time in my life. Weird feeling.','funny,study',0,1,0,'2026-04-07 00:38:23'),(2,3,'I have a crush on someone in my CS class but they are so far out of my league it is almost funny 😭','love,rant',0,0,0,'2026-04-07 00:38:23'),(3,4,'Accidentally called my professor \"mom\" in front of the whole class. I need to transfer universities.','funny,embarrassing',0,0,0,'2026-04-07 00:38:23'),(4,5,'I have been pretending to understand calculus for two semesters. Nobody knows.','study,rant',0,0,0,'2026-04-07 00:38:23'),(5,6,'The library at midnight hits differently. There is something sacred about that silence.','thoughts',0,0,0,'2026-04-07 00:38:23'),(6,2,'Finished an assignment 10 minutes before the deadline after 3 all-nighters. The dopamine hit was unreal.','study,funny',0,0,0,'2026-04-07 00:38:23'),(7,3,'Sometimes I wonder if I chose the right major. Then I remember I chose it because the labs look cool.','thoughts,rant',0,0,0,'2026-04-07 00:38:23'),(8,4,'I volunteer at the campus food bank every Saturday. Never told anyone because I do not want it to seem performative.','wholesome',0,0,0,'2026-04-07 00:38:23'),(9,2,'Hello how are you?','thoughts',0,1,0,'2026-04-07 11:24:25');
/*!40000 ALTER TABLE `confessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `reporter_id` int unsigned NOT NULL,
  `confession_id` int unsigned DEFAULT NULL,
  `comment_id` int unsigned DEFAULT NULL,
  `reported_user_id` int unsigned DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','reviewed','dismissed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reporter_id` (`reporter_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('LrMFuMQ4Q952aXDoB0UmZa0dwYR-N4VO',1777063644,'{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-04-24T20:47:24.255Z\",\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"user\":{\"id\":8,\"anon_username\":\"AnonStormQuokka7286\",\"role\":\"user\",\"avatar_color\":\"#f59e0b\"}}'),('YJze6VoAQy6sNsgbemBb_qG78nspecwG',1776890882,'{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-04-22T20:36:36.842Z\",\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"user\":{\"id\":1,\"anon_username\":\"AnonAdmin0001\",\"role\":\"admin\",\"avatar_color\":\"#7c3aed\",\"gender\":null}}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_interests`
--

DROP TABLE IF EXISTS `user_interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_interests` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `interest` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_interest` (`user_id`,`interest`),
  CONSTRAINT `user_interests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_interests`
--

LOCK TABLES `user_interests` WRITE;
/*!40000 ALTER TABLE `user_interests` DISABLE KEYS */;
INSERT INTO `user_interests` VALUES (19,2,'cooking'),(18,2,'music'),(4,3,'gaming'),(6,3,'music'),(5,3,'tech'),(8,4,'art'),(7,4,'books'),(9,4,'travel'),(11,5,'gaming'),(10,5,'sports'),(12,5,'tech'),(15,6,'books'),(13,6,'music'),(14,6,'travel'),(21,7,'cooking'),(20,7,'music');
/*!40000 ALTER TABLE `user_interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `real_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anon_username` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_banned` tinyint(1) NOT NULL DEFAULT '0',
  `avatar_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#7c3aed',
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `anon_username` (`anon_username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@campus.local','$2a$12$nUDNf8P4U5OX7uiRb06OPueO3vCCqdu0fPbHK/yt9Q6mpdTEK18XS','Platform Admin','AnonAdmin0001','admin',0,'#7c3aed',NULL,NULL,'2026-04-07 00:38:23','2026-04-07 00:38:23'),(2,'alice@demo.edu','$2a$12$B6nG5dTjMl1Il2lX/t0NU.dT7LHvQHrqtJeVXF70Z61kHkxU0dmee','Alice Johnson','AnonStormLynx5931','user',0,'#ec4899',NULL,'','2026-04-07 00:38:23','2026-04-15 19:34:55'),(3,'bob@demo.edu','$2a$12$B6nG5dTjMl1Il2lX/t0NU.dT7LHvQHrqtJeVXF70Z61kHkxU0dmee','Bob Smith','AnonVividFox3751','user',0,'#f59e0b',NULL,NULL,'2026-04-07 00:38:23','2026-04-07 00:38:23'),(4,'carol@demo.edu','$2a$12$B6nG5dTjMl1Il2lX/t0NU.dT7LHvQHrqtJeVXF70Z61kHkxU0dmee','Carol Davis','AnonDigitalManta3952','user',0,'#10b981',NULL,NULL,'2026-04-07 00:38:23','2026-04-07 00:38:23'),(5,'dave@demo.edu','$2a$12$B6nG5dTjMl1Il2lX/t0NU.dT7LHvQHrqtJeVXF70Z61kHkxU0dmee','Dave Wilson','AnonMysticHawk4478','user',0,'#06b6d4',NULL,NULL,'2026-04-07 00:38:23','2026-04-07 00:38:23'),(6,'eve@demo.edu','$2a$12$B6nG5dTjMl1Il2lX/t0NU.dT7LHvQHrqtJeVXF70Z61kHkxU0dmee','Eve Martinez','AnonCrystalLynx2730','user',0,'#ec4899',NULL,NULL,'2026-04-07 00:38:23','2026-04-07 00:38:23'),(7,'abhinan03@gmail.com','$2a$12$d8Qnt8BWPTAFXz3spDlo/uvlQRBjJrZggNJl4mxkxul/d7pkJeE.q','Abhishek','AnonSolarAxolotl8726','user',0,'#ec4899','male','','2026-04-15 19:34:00','2026-04-15 20:21:31'),(8,'abhiipariharr@gmail.com','$2a$12$khs9XgXObZE573dxbXl4QeE1NJKRdGlsb/yo.w47RIGbILysMDUtG','Abhi','AnonStormQuokka7286','user',0,'#f59e0b','male',NULL,'2026-04-17 20:47:24','2026-04-17 20:47:24');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-18  2:25:19
