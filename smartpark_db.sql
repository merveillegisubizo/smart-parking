-- SmartPark Database Schema
-- This file contains the complete database schema for the SmartPark parking management system

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS smartpark_db;
USE smartpark_db;

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS parkingrecord;
DROP TABLE IF EXISTS car;
DROP TABLE IF EXISTS parkingslot;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create parking slot table
CREATE TABLE IF NOT EXISTS parkingslot (
  slotNumber INT PRIMARY KEY,
  slotStatus ENUM('available', 'occupied') DEFAULT 'available'
);

-- Create car table
CREATE TABLE IF NOT EXISTS car (
  plateNumber VARCHAR(20) PRIMARY KEY,
  driverName VARCHAR(100) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL
);

-- Create parking record table
CREATE TABLE IF NOT EXISTS parkingrecord (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plateNumber VARCHAR(20) NOT NULL,
  slotNumber INT NOT NULL,
  entryTime DATETIME DEFAULT CURRENT_TIMESTAMP,
  exitTime DATETIME NULL,
  duration INT NULL,
  FOREIGN KEY (plateNumber) REFERENCES car(plateNumber),
  FOREIGN KEY (slotNumber) REFERENCES parkingslot(slotNumber)
);

-- Create payment table
CREATE TABLE IF NOT EXISTS payment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parkingRecordId INT NOT NULL,
  amountPaid DECIMAL(10, 2) NOT NULL,
  paymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  userId INT NOT NULL,
  FOREIGN KEY (parkingRecordId) REFERENCES parkingrecord(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Insert initial data

-- Insert a demo user (password: admin123)
-- Note: In a real application, passwords should be hashed. This is just for demo purposes.
INSERT INTO users (username, password) VALUES 
('admin', '$2b$10$3euPcmQFCiblsZeEu5s7p.9MUZWg1IkU5Bo5HfGjx9NJ9Ad7SXcie');

-- Insert 20 parking slots
INSERT INTO parkingslot (slotNumber, slotStatus) VALUES 
(1, 'available'),
(2, 'available'),
(3, 'available'),
(4, 'available'),
(5, 'available'),
(6, 'available'),
(7, 'available'),
(8, 'available'),
(9, 'available'),
(10, 'available'),
(11, 'available'),
(12, 'available'),
(13, 'available'),
(14, 'available'),
(15, 'available'),
(16, 'available'),
(17, 'available'),
(18, 'available'),
(19, 'available'),
(20, 'available');

-- Insert sample cars
INSERT INTO car (plateNumber, driverName, phoneNumber) VALUES
('RAB 123A', 'John Doe', '0781234567'),
('RAC 456B', 'Jane Smith', '0789876543'),
('RAD 789C', 'Robert Johnson', '0729876543');

-- Insert sample parking records (some active, some completed)
-- Active parking records (no exit time)
INSERT INTO parkingrecord (plateNumber, slotNumber, entryTime) VALUES
('RAB 123A', 1, NOW() - INTERVAL 2 HOUR);

-- Update slot status for active parking
UPDATE parkingslot SET slotStatus = 'occupied' WHERE slotNumber = 1;

-- Completed parking records
INSERT INTO parkingrecord (plateNumber, slotNumber, entryTime, exitTime, duration) VALUES
('RAC 456B', 2, NOW() - INTERVAL 5 HOUR, NOW() - INTERVAL 2 HOUR, 3),
('RAD 789C', 3, NOW() - INTERVAL 8 HOUR, NOW() - INTERVAL 6 HOUR, 2);

-- Insert sample payments for completed parking records
INSERT INTO payment (parkingRecordId, amountPaid, userId) VALUES
(2, 15.00, 1),  -- 3 hours at $5/hour
(3, 10.00, 1);  -- 2 hours at $5/hour

-- Create indexes for better performance
CREATE INDEX idx_parkingrecord_exitTime ON parkingrecord(exitTime);
CREATE INDEX idx_payment_date ON payment(paymentDate);
CREATE INDEX idx_car_driverName ON car(driverName);

-- Sample queries for reference

-- 1. Get all available parking slots
-- SELECT * FROM parkingslot WHERE slotStatus = 'available';

-- 2. Get all active parking records (cars currently parked)
-- SELECT pr.id, pr.plateNumber, pr.slotNumber, pr.entryTime, c.driverName, c.phoneNumber
-- FROM parkingrecord pr
-- JOIN car c ON pr.plateNumber = c.plateNumber
-- WHERE pr.exitTime IS NULL;

-- 3. Get daily report for a specific date
-- SELECT 
--   p.id as paymentId,
--   p.amountPaid,
--   p.paymentDate,
--   pr.plateNumber,
--   pr.slotNumber,
--   pr.entryTime,
--   pr.exitTime,
--   pr.duration,1
--   c.driverName,
--   c.phoneNumber,
--   u.username as receivedBy
-- FROM payment p
-- JOIN parkingrecord pr ON p.parkingRecordId = pr.id
-- JOIN car c ON pr.plateNumber = c.plateNumber
-- JOIN users u ON p.userId = u.id
-- WHERE DATE(p.paymentDate) = '2023-06-01';

-- 4. Calculate total revenue for a specific date
-- SELECT SUM(amountPaid) as totalRevenue
-- FROM payment
-- WHERE DATE(paymentDate) = '2023-06-01';
