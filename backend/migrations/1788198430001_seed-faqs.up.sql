-- Write your UP migration here
INSERT INTO faqs (category, question, answer) VALUES
  ('Laptop Configuration', 'How do I request a laptop upgrade?', 'Raise a request via the Laptop Issuance task owner (your Department Admin) — upgrades are approved on a case-by-case basis.'),
  ('Laptop Configuration', 'What software comes pre-installed?', 'IT installs the standard toolchain for your department (IDE, VPN client, Slack, and department-specific tools) before handover.'),
  ('General Queries', 'Who do I contact for HR questions?', 'Reach out to your assigned HR representative, listed on your onboarding instance.'),
  ('General Queries', 'When will I receive my official company email?', 'Once your Department Admin completes the "Company Email ID Issuance" task, you will get a notification to activate it.'),
  ('Benefits', 'How do I view my entitlements?', 'Your entitlements catalog is available under the Benefits section, visible to every employee.'),
  ('Benefits', 'When does health insurance coverage start?', 'Coverage begins from your official joining date, once HR confirms enrollment.'),
  ('IT Setup', 'How do I reset my password?', 'Use the "Change Password" flow after logging in — you will be prompted to set a new password on first login.'),
  ('IT Setup', 'Who do I contact for VPN access issues?', 'Contact IT support through the ID Card Issuance task owner or your Department Admin.');
