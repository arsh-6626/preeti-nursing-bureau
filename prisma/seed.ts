/**
 * Base seed: business settings, service catalogue, Delhi NCR service areas,
 * draft legal pages and the first administrator. Safe to run repeatedly.
 *
 * Contact details, prices and registration information are intentionally left
 * empty: the business configures them in Admin → Settings.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { LEGAL_PAGES, ABOUT_TEXT } from "./seed-content";
import { DISCLAIMER_PAGE } from "../src/content/disclaimer";
import { AREAS } from "./areas";

const DEFAULT_ADMIN_EMAIL = "arsh@preetinursing.com";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const SERVICES = [
  {
    slug: "general-duty-assistant",
    name: "General Duty Assistant (GDA)",
    summary: "Day-to-day personal care and support at home.",
    description:
      "A General Duty Assistant helps with daily routines: bathing, dressing, feeding, toileting, moving around the home, and keeping the patient comfortable. GDAs provide personal care, not clinical nursing.",
    requiredSkills: ["Personal hygiene support", "Feeding assistance", "Mobility support", "Bed making"],
    isNursing: false,
  },
  {
    slug: "home-nursing",
    name: "Home Nursing",
    summary: "Qualified nursing care for clinical needs at home.",
    description:
      "For patients who need clinical care at home, such as wound dressing, injections, catheter or tube care, and monitoring as advised by the treating doctor. We confirm the nurse's qualifications with you before any arrangement.",
    requiredSkills: ["Recognised nursing qualification (GNM / ANM / B.Sc Nursing)", "Clinical procedures as prescribed"],
    isNursing: true,
    notes: "Clinical tasks follow the treating doctor's instructions. Nurses do not prescribe or change medication.",
  },
  {
    slug: "male-patient-attendant",
    name: "Male Patient Attendant",
    summary: "A male attendant for personal care and mobility support.",
    description:
      "A male attendant for families who prefer one, often for male patients who need help with bathing, toileting, lifting and transfers.",
    requiredSkills: ["Personal care", "Safe lifting and transfers"],
    isNursing: false,
  },
  {
    slug: "female-patient-attendant",
    name: "Female Patient Attendant",
    summary: "A female attendant for personal care and companionship.",
    description:
      "A female attendant for families who prefer one, for help with personal care, meals, medicines reminders and company through the day or night.",
    requiredSkills: ["Personal care", "Medication reminders"],
    isNursing: false,
  },
  {
    slug: "elderly-care",
    name: "Elderly Care",
    summary: "Patient, respectful support for older family members.",
    description:
      "Support for older adults who need help staying safe and comfortable at home: daily routines, walking support, meals, reminders and companionship.",
    requiredSkills: ["Fall prevention awareness", "Companionship", "Daily routine support"],
    isNursing: false,
  },
  {
    slug: "bedridden-patient-care",
    name: "Bedridden Patient Care",
    summary: "Care for patients who are confined to bed.",
    description:
      "For patients who cannot leave the bed: position changes to protect the skin, sponge baths, feeding support, toileting and keeping the patient clean and comfortable.",
    requiredSkills: ["Repositioning", "Bed bath", "Pressure-area care awareness"],
    isNursing: false,
  },
  {
    slug: "post-hospitalization-care",
    name: "Post-Hospitalisation Care",
    summary: "Help settling back home after a hospital stay.",
    description:
      "Support in the days and weeks after discharge, following the hospital's discharge advice: mobility, hygiene, meals and reminders. Clinical tasks need a qualified nurse.",
    requiredSkills: ["Following discharge instructions", "Mobility support"],
    isNursing: false,
  },
  {
    slug: "long-term-patient-care",
    name: "Long-Term Patient Care",
    summary: "Steady, ongoing care arrangements for months at a time.",
    description:
      "For families who need care over a longer period. We plan continuity, rest days and relief with you, and review the arrangement regularly.",
    requiredSkills: ["Consistency", "Daily routine support"],
    isNursing: false,
  },
  {
    slug: "baby-care",
    name: "Baby Care (Japa Maid)",
    summary: "Newborn and mother care in the first weeks at home.",
    description:
      "An experienced japa maid helps with the newborn and the new mother: bathing and oil massage for the baby, burping and settling, keeping the nursery clean, and supporting the mother's rest and recovery. This is caregiving, not medical care; follow your paediatrician's advice for the baby's health.",
    requiredSkills: ["Newborn bathing and massage", "Feeding and burping support", "Mother's postnatal care"],
    isNursing: false,
  },
];

async function main() {
  await db.businessSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, aboutText: ABOUT_TEXT },
  });

  for (const [i, s] of SERVICES.entries()) {
    await db.serviceCategory.upsert({
      where: { slug: s.slug },
      update: {},
      create: { ...s, sortOrder: (i + 1) * 10 },
    });
  }

  for (const [city, localities] of Object.entries(AREAS)) {
    for (const [i, [locality, pincode]] of localities.entries()) {
      await db.serviceArea.upsert({
        where: { city_locality: { city, locality } },
        update: {},
        create: { city, locality, pincode, sortOrder: i },
      });
    }
  }

  for (const page of LEGAL_PAGES) {
    await db.contentPage.upsert({ where: { slug: page.slug }, update: {}, create: { ...page, needsReview: true } });
  }
  // Supplied by the bureau, so it is published as written.
  await db.contentPage.upsert({ where: { slug: DISCLAIMER_PAGE.slug }, update: {}, create: { slug: DISCLAIMER_PAGE.slug, title: DISCLAIMER_PAGE.title, body: DISCLAIMER_PAGE.body, needsReview: false } });

  const email = (process.env.SEED_ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
    const exists = await db.user.findUnique({ where: { email } });
    if (!exists) {
      await db.user.create({
        data: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
      });
      console.log(`Created administrator ${email}`);
    }
  } else {
    console.warn("SEED_ADMIN_PASSWORD not set: no administrator created.");
  }
  console.log("Base seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
