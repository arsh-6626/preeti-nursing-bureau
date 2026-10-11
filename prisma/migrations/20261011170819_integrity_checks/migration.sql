-- Integrity checks that Prisma cannot express in the schema.

ALTER TABLE "ServiceRequest"
  ADD CONSTRAINT "ServiceRequest_duration_positive" CHECK ("durationValue" > 0 AND "durationValue" <= 365),
  ADD CONSTRAINT "ServiceRequest_consent_required" CHECK ("contactConsent" = true),
  ADD CONSTRAINT "ServiceRequest_service_or_other" CHECK ("serviceCategoryId" IS NOT NULL OR "otherServiceText" IS NOT NULL);

ALTER TABLE "Assignment"
  ADD CONSTRAINT "Assignment_duration_positive" CHECK ("durationValue" > 0),
  ADD CONSTRAINT "Assignment_dates_ordered" CHECK ("endDate" >= "startDate"),
  ADD CONSTRAINT "Assignment_amounts_non_negative" CHECK ("customerAmount" >= 0 AND "caregiverPayout" >= 0 AND ("quotedAmount" IS NULL OR "quotedAmount" >= 0)),
  ADD CONSTRAINT "Assignment_commission_rate_range" CHECK ("commissionRate" IS NULL OR ("commissionRate" >= 0 AND "commissionRate" <= 100)),
  ADD CONSTRAINT "Assignment_commission_fixed_non_negative" CHECK ("commissionFixedAmount" IS NULL OR "commissionFixedAmount" >= 0),
  ADD CONSTRAINT "Assignment_commission_config" CHECK (
    ("commissionMethod" = 'PERCENTAGE' AND "commissionRate" IS NOT NULL) OR
    ("commissionMethod" = 'FIXED' AND "commissionFixedAmount" IS NOT NULL)
  );

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0),
  ADD CONSTRAINT "Payment_reversal_link" CHECK (("entryType" = 'REVERSAL') = ("reversesPaymentId" IS NOT NULL));

ALTER TABLE "CommissionRecord"
  ADD CONSTRAINT "CommissionRecord_sign" CHECK (
    ("entryType" = 'RECOGNITION' AND "amount" >= 0) OR ("entryType" = 'REVERSAL' AND "amount" <= 0)
  );

ALTER TABLE "FinancialAdjustment"
  ADD CONSTRAINT "FinancialAdjustment_non_zero" CHECK ("amount" <> 0);

ALTER TABLE "PricingRule"
  ADD CONSTRAINT "PricingRule_amounts_non_negative" CHECK ("customerRate" >= 0 AND "caregiverPayout" >= 0);

ALTER TABLE "BusinessSettings"
  ADD CONSTRAINT "BusinessSettings_singleton" CHECK ("id" = 1),
  ADD CONSTRAINT "BusinessSettings_commission_rate_range" CHECK ("commissionRate" >= 0 AND "commissionRate" <= 100);

ALTER TABLE "Caregiver"
  ADD CONSTRAINT "Caregiver_experience_range" CHECK ("experienceYears" >= 0 AND "experienceYears" <= 70),
  ADD CONSTRAINT "Caregiver_payouts_non_negative" CHECK (("payout12h" IS NULL OR "payout12h" >= 0) AND ("payout24h" IS NULL OR "payout24h" >= 0));

ALTER TABLE "CaregiverAvailability"
  ADD CONSTRAINT "CaregiverAvailability_dates_ordered" CHECK ("endDate" IS NULL OR "endDate" >= "startDate");

-- Search support for case-insensitive name/phone lookups.
CREATE INDEX "Customer_name_lower_idx" ON "Customer" (lower("name"));
