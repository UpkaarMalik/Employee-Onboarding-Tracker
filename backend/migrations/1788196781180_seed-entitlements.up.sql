-- Write your UP migration here
INSERT INTO entitlements (name, description, category) VALUES
  ('Health Insurance', 'Company-sponsored group health insurance coverage.', 'INSURANCE'),
  ('Laptop', 'Standard-issue work laptop selected from approved configurations.', 'DEVICE'),
  ('Meal Card', 'Prepaid meal card for daily food expenses.', 'PERK'),
  ('Gym Membership', 'Subsidized membership at partner gyms.', 'PERK');
