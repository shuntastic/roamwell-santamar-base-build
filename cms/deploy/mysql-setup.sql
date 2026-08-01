-- Create MySQL database + user for Strapi on a LAMP host.
-- Run as MySQL root, then update cms/.env with matching credentials.

CREATE DATABASE IF NOT EXISTS santamar_cms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'santamar'@'localhost' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON santamar_cms.* TO 'santamar'@'localhost';
FLUSH PRIVILEGES;
