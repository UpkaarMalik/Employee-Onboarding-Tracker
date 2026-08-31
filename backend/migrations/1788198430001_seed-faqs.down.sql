-- Write your DOWN migration here
DELETE FROM faqs WHERE category IN ('Laptop Configuration', 'General Queries', 'Benefits', 'IT Setup');
