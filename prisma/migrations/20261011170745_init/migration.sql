-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('12_HOURS', '24_HOURS');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'REQUIREMENTS_COLLECTED', 'MATCHING', 'CAREGIVER_ASSIGNED', 'SERVICE_ACTIVE', 'COMPLETED', 'CANCELLED', 'UNFULFILLED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'PHONE', 'WHATSAPP', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "Mobility" AS ENUM ('MOBILE', 'NEEDS_ASSISTANCE', 'BEDRIDDEN', 'OTHER');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('NO_PREFERENCE', 'FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "ShiftTiming" AS ENUM ('NO_PREFERENCE', 'DAY', 'NIGHT');

-- CreateEnum
CREATE TYPE "ArrangementType" AS ENUM ('ONE_TIME', 'TEMPORARY', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "DurationUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('PHONE', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'ON_ASSIGNMENT', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AvailabilityKind" AS ENUM ('AVAILABLE_WINDOW', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "AffiliationType" AS ENUM ('INDEPENDENT', 'AGENCY_MANAGED', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('IDENTITY', 'QUALIFICATION', 'REFERENCE', 'BACKGROUND', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PROPOSED', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REPLACEMENT_REQUIRED');

-- CreateEnum
CREATE TYPE "CommissionMethod" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "CommissionBasis" AS ENUM ('CUSTOMER_AMOUNT', 'CAREGIVER_PAYOUT');

-- CreateEnum
CREATE TYPE "CommissionRecognition" AS ENUM ('ON_CONFIRMATION', 'ON_COMPLETION');

-- CreateEnum
CREATE TYPE "CommissionEntryType" AS ENUM ('RECOGNITION', 'REVERSAL');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('CUSTOMER_RECEIPT', 'CUSTOMER_REFUND', 'CAREGIVER_PAYOUT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentEntryType" AS ENUM ('PAYMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "AdjustmentTarget" AS ENUM ('CUSTOMER_CHARGE', 'CAREGIVER_PAYOUT');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('REACHED', 'NO_ANSWER', 'CALLBACK_REQUESTED', 'WRONG_NUMBER', 'NOT_INTERESTED', 'OTHER');

-- CreateEnum
CREATE TYPE "RatePeriod" AS ENUM ('PER_DAY', 'PER_MONTH');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "requiredSkills" TEXT[],
    "indicativePrice" TEXT,
    "notes" TEXT,
    "isNursing" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceArea" (
    "id" UUID NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "pincode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingRule" (
    "id" UUID NOT NULL,
    "serviceCategoryId" UUID NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "ratePeriod" "RatePeriod" NOT NULL DEFAULT 'PER_DAY',
    "customerRate" DECIMAL(12,2) NOT NULL,
    "caregiverPayout" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "businessName" TEXT NOT NULL DEFAULT 'Preeti Nursing Bureau',
    "logoUrl" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "businessHours" TEXT,
    "address" TEXT,
    "regionLabel" TEXT NOT NULL DEFAULT 'Delhi NCR',
    "heroHeadline" TEXT NOT NULL DEFAULT 'Trusted care at home, arranged by people who call you back',
    "heroSubtext" TEXT NOT NULL DEFAULT 'Tell us what your family needs. We call you, understand the situation, and suggest a suitable caregiver.',
    "aboutText" TEXT NOT NULL DEFAULT '',
    "consentText" TEXT NOT NULL DEFAULT 'I agree to be contacted by phone or WhatsApp about this request.',
    "whatsappPrefill" TEXT NOT NULL DEFAULT 'Hello, I would like to ask about patient care at home.',
    "followUpDefaultHours" INTEGER NOT NULL DEFAULT 24,
    "allowOtherService" BOOLEAN NOT NULL DEFAULT true,
    "commissionMethod" "CommissionMethod" NOT NULL DEFAULT 'PERCENTAGE',
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "commissionFixedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionBasis" "CommissionBasis" NOT NULL DEFAULT 'CUSTOMER_AMOUNT',
    "commissionRecognition" "CommissionRecognition" NOT NULL DEFAULT 'ON_CONFIRMATION',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPage" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "relationship" TEXT,
    "preferredContact" "ContactMethod" NOT NULL DEFAULT 'PHONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "publicTokenHash" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "customerId" UUID NOT NULL,
    "serviceCategoryId" UUID,
    "otherServiceText" TEXT,
    "assistanceType" TEXT,
    "mobility" "Mobility" NOT NULL,
    "careDescription" TEXT NOT NULL,
    "preferredGender" "GenderPreference" NOT NULL DEFAULT 'NO_PREFERENCE',
    "nursingSkillsRequired" TEXT,
    "additionalRequirements" TEXT,
    "shiftType" "ShiftType" NOT NULL,
    "shiftTiming" "ShiftTiming" NOT NULL DEFAULT 'NO_PREFERENCE',
    "startDate" DATE NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL,
    "arrangementType" "ArrangementType" NOT NULL,
    "serviceAreaId" UUID,
    "city" TEXT NOT NULL,
    "locality" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "address" TEXT,
    "contactConsent" BOOLEAN NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "assignedToId" UUID,
    "nextFollowUpAt" TIMESTAMP(3),
    "lastCallOutcome" "CallOutcome",
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusChange" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "fromStatus" "LeadStatus",
    "toStatus" "LeadStatus" NOT NULL,
    "note" TEXT,
    "changedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" UUID NOT NULL,
    "requestId" UUID,
    "customerId" UUID,
    "caregiverId" UUID,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "outcome" "CallOutcome",
    "notes" TEXT,
    "assignedToId" UUID,
    "createdById" UUID NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caregiver" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "photoUrl" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "skills" TEXT[],
    "qualifications" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "languages" TEXT[],
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "supportedShifts" "ShiftType"[],
    "payout12h" DECIMAL(12,2),
    "payout24h" DECIMAL(12,2),
    "payoutPeriod" "RatePeriod" NOT NULL DEFAULT 'PER_DAY',
    "affiliation" "AffiliationType" NOT NULL DEFAULT 'INDEPENDENT',
    "agencyName" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaregiverService" (
    "caregiverId" UUID NOT NULL,
    "serviceCategoryId" UUID NOT NULL,

    CONSTRAINT "CaregiverService_pkey" PRIMARY KEY ("caregiverId","serviceCategoryId")
);

-- CreateTable
CREATE TABLE "CaregiverArea" (
    "caregiverId" UUID NOT NULL,
    "serviceAreaId" UUID NOT NULL,

    CONSTRAINT "CaregiverArea_pkey" PRIMARY KEY ("caregiverId","serviceAreaId")
);

-- CreateTable
CREATE TABLE "CaregiverAvailability" (
    "id" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "kind" "AvailabilityKind" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaregiverAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "documentRef" TEXT,
    "expiresAt" DATE,
    "verifiedAt" TIMESTAMP(3),
    "reviewedById" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "caregiverId" UUID NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "durationValue" INTEGER NOT NULL,
    "durationUnit" "DurationUnit" NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PROPOSED',
    "quotedAmount" DECIMAL(12,2),
    "customerAmount" DECIMAL(12,2) NOT NULL,
    "caregiverPayout" DECIMAL(12,2) NOT NULL,
    "commissionMethod" "CommissionMethod" NOT NULL,
    "commissionRate" DECIMAL(5,2),
    "commissionFixedAmount" DECIMAL(12,2),
    "commissionBasis" "CommissionBasis" NOT NULL DEFAULT 'CUSTOMER_AMOUNT',
    "customerAcceptedAt" TIMESTAMP(3),
    "caregiverAcceptedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" UUID,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "staffingPlan" TEXT,
    "financialNotes" TEXT,
    "replacesAssignmentId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentEvent" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "fromStatus" "AssignmentStatus",
    "toStatus" "AssignmentStatus" NOT NULL,
    "note" TEXT,
    "actorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRecord" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "entryType" "CommissionEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "CommissionMethod" NOT NULL,
    "rate" DECIMAL(5,2),
    "basisAmount" DECIMAL(12,2),
    "reason" TEXT,
    "recordedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "entryType" "PaymentEntryType" NOT NULL DEFAULT 'PAYMENT',
    "amount" DECIMAL(12,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "methodNote" TEXT,
    "paidOn" DATE NOT NULL,
    "transactionRef" TEXT,
    "notes" TEXT,
    "reversesPaymentId" UUID,
    "recordedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAdjustment" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "target" "AdjustmentTarget" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_isActive_sortOrder_idx" ON "ServiceCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ServiceArea_isActive_city_idx" ON "ServiceArea"("isActive", "city");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceArea_city_locality_key" ON "ServiceArea"("city", "locality");

-- CreateIndex
CREATE UNIQUE INDEX "PricingRule_serviceCategoryId_shiftType_key" ON "PricingRule"("serviceCategoryId", "shiftType");

-- CreateIndex
CREATE UNIQUE INDEX "ContentPage_slug_key" ON "ContentPage"("slug");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_reference_key" ON "ServiceRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_publicTokenHash_key" ON "ServiceRequest"("publicTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_idempotencyKey_key" ON "ServiceRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_createdAt_idx" ON "ServiceRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_createdAt_idx" ON "ServiceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_nextFollowUpAt_idx" ON "ServiceRequest"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceCategoryId_idx" ON "ServiceRequest"("serviceCategoryId");

-- CreateIndex
CREATE INDEX "ServiceRequest_city_idx" ON "ServiceRequest"("city");

-- CreateIndex
CREATE INDEX "ServiceRequest_assignedToId_idx" ON "ServiceRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "ServiceRequest_customerId_idx" ON "ServiceRequest"("customerId");

-- CreateIndex
CREATE INDEX "StatusChange_requestId_createdAt_idx" ON "StatusChange"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalNote_requestId_createdAt_idx" ON "InternalNote"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "InternalNote_caregiverId_idx" ON "InternalNote"("caregiverId");

-- CreateIndex
CREATE INDEX "InternalNote_customerId_idx" ON "InternalNote"("customerId");

-- CreateIndex
CREATE INDEX "FollowUp_status_dueAt_idx" ON "FollowUp"("status", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUp_requestId_idx" ON "FollowUp"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_code_key" ON "Caregiver"("code");

-- CreateIndex
CREATE INDEX "Caregiver_archivedAt_availabilityStatus_idx" ON "Caregiver"("archivedAt", "availabilityStatus");

-- CreateIndex
CREATE INDEX "Caregiver_phone_idx" ON "Caregiver"("phone");

-- CreateIndex
CREATE INDEX "Caregiver_fullName_idx" ON "Caregiver"("fullName");

-- CreateIndex
CREATE INDEX "CaregiverService_serviceCategoryId_idx" ON "CaregiverService"("serviceCategoryId");

-- CreateIndex
CREATE INDEX "CaregiverArea_serviceAreaId_idx" ON "CaregiverArea"("serviceAreaId");

-- CreateIndex
CREATE INDEX "CaregiverAvailability_caregiverId_startDate_idx" ON "CaregiverAvailability"("caregiverId", "startDate");

-- CreateIndex
CREATE INDEX "VerificationRecord_caregiverId_idx" ON "VerificationRecord"("caregiverId");

-- CreateIndex
CREATE INDEX "VerificationRecord_expiresAt_idx" ON "VerificationRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_replacesAssignmentId_key" ON "Assignment"("replacesAssignmentId");

-- CreateIndex
CREATE INDEX "Assignment_caregiverId_status_idx" ON "Assignment"("caregiverId", "status");

-- CreateIndex
CREATE INDEX "Assignment_requestId_idx" ON "Assignment"("requestId");

-- CreateIndex
CREATE INDEX "Assignment_status_startDate_idx" ON "Assignment"("status", "startDate");

-- CreateIndex
CREATE INDEX "AssignmentEvent_assignmentId_createdAt_idx" ON "AssignmentEvent"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "CommissionRecord_assignmentId_idx" ON "CommissionRecord"("assignmentId");

-- CreateIndex
CREATE INDEX "CommissionRecord_createdAt_idx" ON "CommissionRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reversesPaymentId_key" ON "Payment"("reversesPaymentId");

-- CreateIndex
CREATE INDEX "Payment_assignmentId_direction_idx" ON "Payment"("assignmentId", "direction");

-- CreateIndex
CREATE INDEX "Payment_paidOn_idx" ON "Payment"("paidOn");

-- CreateIndex
CREATE INDEX "FinancialAdjustment_assignmentId_idx" ON "FinancialAdjustment"("assignmentId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverService" ADD CONSTRAINT "CaregiverService_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverService" ADD CONSTRAINT "CaregiverService_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverArea" ADD CONSTRAINT "CaregiverArea_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverArea" ADD CONSTRAINT "CaregiverArea_serviceAreaId_fkey" FOREIGN KEY ("serviceAreaId") REFERENCES "ServiceArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaregiverAvailability" ADD CONSTRAINT "CaregiverAvailability_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_replacesAssignmentId_fkey" FOREIGN KEY ("replacesAssignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentEvent" ADD CONSTRAINT "AssignmentEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentEvent" ADD CONSTRAINT "AssignmentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRecord" ADD CONSTRAINT "CommissionRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_reversesPaymentId_fkey" FOREIGN KEY ("reversesPaymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAdjustment" ADD CONSTRAINT "FinancialAdjustment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAdjustment" ADD CONSTRAINT "FinancialAdjustment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
