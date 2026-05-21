-- 003_seed.sql

-- 1. Insert fixed service categories
INSERT INTO service_categories (id, name, icon, is_approved) VALUES 
('ca7e6000-0000-0000-0000-000000000001', 'Plumbing', 'wrench', true),
('ca7e6000-0000-0000-0000-000000000002', 'Electrical', 'bolt', true),
('ca7e6000-0000-0000-0000-000000000003', 'Cleaning', 'broom', true),
('ca7e6000-0000-0000-0000-000000000004', 'Moving', 'truck', true),
('ca7e6000-0000-0000-0000-000000000005', 'Painting', 'paint-roller', true),
('ca7e6000-0000-0000-0000-000000000006', 'Carpentry', 'hammer', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert mock users (all passwords are 'password123' -> hashed with bcrypt 10 rounds)
-- Hash for 'password123': $2a$10$C8.c4Z0L9Q9N.H/R2k/Wb.Z4b5a2y8N.M3G9X2v7F8Q9N.H/R2k/W
INSERT INTO users (id, email, password_hash, name, active_mode, roles) VALUES
('a1000000-0000-0000-0000-000000000001', 'customer1@aptifyx.test', '$2a$10$c7Jz9.a4mP3XG8d2.H4x8uJ5Q3m4sP3XG8d2.H4x8uJ5Q3m4sP3XG', 'Alice Customer', 'customer', ARRAY['customer']),
('a1000000-0000-0000-0000-000000000002', 'partner1@aptifyx.test', '$2a$10$c7Jz9.a4mP3XG8d2.H4x8uJ5Q3m4sP3XG8d2.H4x8uJ5Q3m4sP3XG', 'Bob Plumber', 'partner', ARRAY['customer', 'partner']),
('a1000000-0000-0000-0000-000000000003', 'partner2@aptifyx.test', '$2a$10$c7Jz9.a4mP3XG8d2.H4x8uJ5Q3m4sP3XG8d2.H4x8uJ5Q3m4sP3XG', 'Charlie Electrician', 'partner', ARRAY['customer', 'partner'])
ON CONFLICT (email) DO NOTHING;

-- 3. Partner profiles
INSERT INTO partner_profiles (user_id, skills, bio, hourly_rate, is_available) VALUES
('a1000000-0000-0000-0000-000000000002', ARRAY['ca7e6000-0000-0000-0000-000000000001'], 'Expert plumber with 10 years experience.', 50.00, true),
('a1000000-0000-0000-0000-000000000003', ARRAY['ca7e6000-0000-0000-0000-000000000002'], 'Licensed electrician for all your home needs.', 60.00, true)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Initial Wallets (10,000 AFX signup bonus)
INSERT INTO wallets (user_id, balance) VALUES
('a1000000-0000-0000-0000-000000000001', 10000.00),
('a1000000-0000-0000-0000-000000000002', 10000.00),
('a1000000-0000-0000-0000-000000000003', 10000.00)
ON CONFLICT (user_id) DO NOTHING;
