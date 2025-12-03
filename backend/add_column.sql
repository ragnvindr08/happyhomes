-- SQL script to add listing_type column to api_house table
-- Run this if migration doesn't work

ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale';

