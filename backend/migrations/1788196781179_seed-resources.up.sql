-- Write your UP migration here
-- Seed data (company-wide, read-anytime policy docs — not tasks)
INSERT INTO resources (title, description, category, file_url, department_id, is_downloadable) VALUES
  ('Meal Policy', 'Guidelines on meal allowances and reimbursement.', 'POLICY', '/seed-placeholder/meal-policy.pdf', NULL, false),
  ('Travel Policy', 'Guidelines on business travel booking and expenses.', 'POLICY', '/seed-placeholder/travel-policy.pdf', NULL, false),
  ('Conveyance SOP', 'Standard operating procedure for local conveyance claims.', 'POLICY', '/seed-placeholder/conveyance-sop.pdf', NULL, false);
