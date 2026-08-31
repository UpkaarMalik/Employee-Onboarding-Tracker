-- Write your DOWN migration here
DELETE FROM entitlements WHERE name IN ('Health Insurance', 'Laptop', 'Meal Card', 'Gym Membership');
