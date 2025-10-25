-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 24, 2025 at 10:57 PM
-- Server version: 10.5.25-MariaDB-cll-lve
-- PHP Version: 8.1.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `itmedservices_quiz`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'kemo', '$2b$10$VcvFZ10Ms0BKg9zttVTYvup8v0aMc6bnqJB.iftX6.7yiRnExlA3.', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `id` int(11) NOT NULL,
  `participantId` int(11) NOT NULL,
  `questionId` int(11) NOT NULL,
  `selectedAnswer` varchar(255) NOT NULL,
  `isCorrect` tinyint(1) NOT NULL,
  `answeredAt` datetime DEFAULT NULL,
  `gameSessionId` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`id`, `participantId`, `questionId`, `selectedAnswer`, `isCorrect`, `answeredAt`, `gameSessionId`) VALUES
(49, 37, 6, 'A', 0, '2025-10-22 09:08:22', 1),
(50, 37, 7, 'C', 1, '2025-10-22 09:08:41', 1);

-- --------------------------------------------------------

--
-- Table structure for table `game_leaderboards`
--

CREATE TABLE `game_leaderboards` (
  `id` int(11) NOT NULL,
  `gameSessionId` int(11) NOT NULL,
  `participantId` int(11) NOT NULL,
  `totalScore` int(11) DEFAULT 0,
  `totalQuestionsAnswered` int(11) DEFAULT 0,
  `correctAnswersCount` int(11) DEFAULT 0,
  `accuracyPercent` float DEFAULT 0,
  `fastestAnswerSeconds` float DEFAULT NULL,
  `questionsCorrect` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`questionsCorrect`)),
  `rank` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `game_leaderboards`
--

INSERT INTO `game_leaderboards` (`id`, `gameSessionId`, `participantId`, `totalScore`, `totalQuestionsAnswered`, `correctAnswersCount`, `accuracyPercent`, `fastestAnswerSeconds`, `questionsCorrect`, `rank`, `createdAt`, `updatedAt`) VALUES
(30, 1, 37, 10, 2, 1, 50, 1761120000, '[7]', 1, '2025-10-22 09:09:02', '2025-10-22 09:09:02');

-- --------------------------------------------------------

--
-- Table structure for table `game_sessions`
--

CREATE TABLE `game_sessions` (
  `id` int(11) NOT NULL,
  `status` enum('waiting','active','ended') DEFAULT 'waiting',
  `currentQuestionId` int(11) DEFAULT NULL,
  `startedAt` datetime DEFAULT NULL,
  `endedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `game_sessions`
--

INSERT INTO `game_sessions` (`id`, `status`, `currentQuestionId`, `startedAt`, `endedAt`, `createdAt`, `updatedAt`) VALUES
(1, 'ended', 7, '2025-10-22 09:08:15', '2025-10-22 09:09:02', '2025-10-22 09:02:17', '2025-10-22 09:09:02');

-- --------------------------------------------------------

--
-- Table structure for table `participants`
--

CREATE TABLE `participants` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `score` int(11) DEFAULT 0,
  `joinedAt` datetime DEFAULT NULL,
  `gameSessionId` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `participants`
--

INSERT INTO `participants` (`id`, `name`, `phone`, `score`, `joinedAt`, `gameSessionId`) VALUES
(35, 'Fsd', '551', 0, '2025-10-22 09:01:01', 1),
(36, 'Hadag', '58', 0, '2025-10-22 09:03:49', 1),
(37, 'rwr', '213213', 0, '2025-10-22 09:07:25', 1);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `id` int(11) NOT NULL,
  `text` varchar(255) NOT NULL,
  `choices` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`choices`)),
  `correctAnswer` varchar(255) NOT NULL,
  `order` int(11) NOT NULL,
  `isActive` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `gameSessionId` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`id`, `text`, `choices`, `correctAnswer`, `order`, `isActive`, `createdAt`, `updatedAt`, `gameSessionId`) VALUES
(5, 'What is DAS', '[{\"key\":\"A\",\"text\":\"Drives & Storage\"},{\"key\":\"B\",\"text\":\"Direct Attached Storage\"},{\"key\":\"C\",\"text\":\"Drive Attached Storage \"},{\"key\":\"D\",\"text\":\"Drives Aand Storage\"}]', 'B', 2, 0, '2025-10-20 10:01:25', '2025-10-24 08:08:33', 1),
(6, 'What does ABB (Active Backup For Business) cover?', '[{\"key\":\"A\",\"text\":\"Backup All PCs and MACs\"},{\"key\":\"B\",\"text\":\"Backup All Physical Servers\"},{\"key\":\"C\",\"text\":\"Backup all VMs\"},{\"key\":\"D\",\"text\":\"Backup All office 365 and Google workspace \"},{\"key\":\"E\",\"text\":\"All of the Above\"}]', 'E', 1, 0, '2025-10-20 10:02:04', '2025-10-24 08:08:26', 1),
(7, 'What is OPS', '[{\"key\":\"A\",\"text\":\"Operating system for mini pc \"},{\"key\":\"B\",\"text\":\"Open Pluggable Specification\"},{\"key\":\"C\",\"text\":\"Operating system screen\"},{\"key\":\"D\",\"text\":\"Open Phrame System \"}]', 'B', 5, 0, '2025-10-20 10:02:35', '2025-10-24 08:08:55', 1),
(8, 'What is ADM', '[{\"key\":\"A\",\"text\":\"Asustor Data Master\"},{\"key\":\"B\",\"text\":\"Asustor Drives Manager\"},{\"key\":\"C\",\"text\":\"Asus Drives Manager\"},{\"key\":\"D\",\"text\":\"Automated Disk Management\"}]', 'B', 3, 0, '2025-10-24 07:05:02', '2025-10-24 08:08:40', 1),
(9, 'What Football Team does the owner of Jacarta support', '[{\"key\":\"A\",\"text\":\"تشلسي\"},{\"key\":\"B\",\"text\":\"نادي النجمة \"},{\"key\":\"C\",\"text\":\"نادي الحكمة \"},{\"key\":\"D\",\"text\":\"نادي الصفا\"}]', 'A', 4, 0, '2025-10-24 08:07:33', '2025-10-24 08:09:01', 1);

-- --------------------------------------------------------

--
-- Table structure for table `question_leaderboards`
--

CREATE TABLE `question_leaderboards` (
  `id` int(11) NOT NULL,
  `questionId` int(11) NOT NULL,
  `participantId` int(11) NOT NULL,
  `rank` int(11) NOT NULL,
  `scoreForQuestion` int(11) NOT NULL DEFAULT 0,
  `isCorrect` tinyint(1) NOT NULL,
  `answeredAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `question_leaderboards`
--

INSERT INTO `question_leaderboards` (`id`, `questionId`, `participantId`, `rank`, `scoreForQuestion`, `isCorrect`, `answeredAt`, `createdAt`, `updatedAt`) VALUES
(49, 6, 37, 0, 0, 0, '2025-10-22 09:08:22', '2025-10-22 09:08:27', '2025-10-22 09:08:27'),
(51, 7, 37, 1, 100, 1, '2025-10-22 09:08:41', '2025-10-22 09:08:58', '2025-10-22 09:08:58');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `participantId` (`participantId`),
  ADD KEY `questionId` (`questionId`);

--
-- Indexes for table `game_leaderboards`
--
ALTER TABLE `game_leaderboards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gameSessionId` (`gameSessionId`),
  ADD KEY `participantId` (`participantId`);

--
-- Indexes for table `game_sessions`
--
ALTER TABLE `game_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `currentQuestionId` (`currentQuestionId`);

--
-- Indexes for table `participants`
--
ALTER TABLE `participants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `question_leaderboards`
--
ALTER TABLE `question_leaderboards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `questionId` (`questionId`),
  ADD KEY `participantId` (`participantId`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `game_leaderboards`
--
ALTER TABLE `game_leaderboards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `game_sessions`
--
ALTER TABLE `game_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `participants`
--
ALTER TABLE `participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `question_leaderboards`
--
ALTER TABLE `question_leaderboards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `answers`
--
ALTER TABLE `answers`
  ADD CONSTRAINT `fk_answer_participant` FOREIGN KEY (`participantId`) REFERENCES `participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_answer_question` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `game_leaderboards`
--
ALTER TABLE `game_leaderboards`
  ADD CONSTRAINT `fk_gleader_participant` FOREIGN KEY (`participantId`) REFERENCES `participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_gleader_session` FOREIGN KEY (`gameSessionId`) REFERENCES `game_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `game_sessions`
--
ALTER TABLE `game_sessions`
  ADD CONSTRAINT `fk_session_question` FOREIGN KEY (`currentQuestionId`) REFERENCES `questions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `question_leaderboards`
--
ALTER TABLE `question_leaderboards`
  ADD CONSTRAINT `fk_qleader_participant` FOREIGN KEY (`participantId`) REFERENCES `participants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_qleader_question` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
