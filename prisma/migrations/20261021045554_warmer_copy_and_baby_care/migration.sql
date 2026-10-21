-- AlterTable
ALTER TABLE "BusinessSettings" ALTER COLUMN "heroHeadline" SET DEFAULT 'Caring for your loved ones, as we would our own',
ALTER COLUMN "heroSubtext" SET DEFAULT 'Tell us about the person you are worried about. We will call you back, listen, and find someone kind and trained to look after them at home.';

-- Move the live hero text to the new wording, unless the owner has already changed it.
UPDATE "BusinessSettings" SET "heroHeadline" = 'Caring for your loved ones, as we would our own'
WHERE "heroHeadline" = 'Patient care at home, arranged by people who call you back';
UPDATE "BusinessSettings" SET "heroSubtext" = 'Tell us about the person you are worried about. We will call you back, listen, and find someone kind and trained to look after them at home.'
WHERE "heroSubtext" = 'Tell us what your family needs. We call you, understand the situation, and suggest a suitable caregiver.';

-- New service: baby care (japa maid). Skipped if it already exists.
INSERT INTO "ServiceCategory" ("id", "name", "slug", "summary", "description", "requiredSkills", "isNursing", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Baby Care (Japa Maid)',
  'baby-care',
  'Newborn and mother care in the first weeks at home.',
  'An experienced japa maid helps with the newborn and the new mother: bathing and oil massage for the baby, burping and settling, keeping the nursery clean, and supporting the mother''s rest and recovery. This is caregiving, not medical care; follow your paediatrician''s advice for the baby''s health.',
  ARRAY['Newborn bathing and massage', 'Feeding and burping support', 'Mother''s postnatal care'],
  false,
  true,
  COALESCE((SELECT MAX("sortOrder") FROM "ServiceCategory"), 0) + 10,
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;
