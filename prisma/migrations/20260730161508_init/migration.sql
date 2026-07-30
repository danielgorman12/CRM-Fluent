-- CreateEnum
CREATE TYPE "StageCategory" AS ENUM ('ACTIVE', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "GeocodeStatus" AS ENUM ('PENDING', 'GEOCODED', 'MANUAL', 'FAILED');

-- CreateEnum
CREATE TYPE "SuccessionTimeline" AS ENUM ('UNDER_1YR', 'ONE_TO_3YR', 'THREE_TO_5YR', 'FIVE_PLUS_YR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "SuccessorStatus" AS ENUM ('NONE', 'FAMILY', 'INTERNAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EMAIL', 'CALL', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'EXTRACTED', 'CALCULATED');

-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('CONFIRMED', 'NEEDS_REVIEW', 'MISSING', 'CONFLICTING', 'MANUALLY_OVERRIDDEN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vertical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Vertical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" "StageCategory" NOT NULL,
    "colorHex" TEXT NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StageDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "verticalId" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "geocodeStatus" "GeocodeStatus" NOT NULL DEFAULT 'PENDING',
    "geocodeSource" TEXT,
    "geocodedAt" TIMESTAMP(3),
    "currentARR" DECIMAL(65,30),
    "currentEBITDA" DECIMAL(65,30),
    "currentEBITDAMargin" DECIMAL(65,30),
    "customerRetentionNotes" TEXT,
    "grossRetentionPct" DECIMAL(65,30),
    "netRetentionPct" DECIMAL(65,30),
    "currentStageId" TEXT NOT NULL,
    "dealOwnerId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectStageHistory" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "changedById" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ProspectStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scorecard" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "financialAttractivenessScore" INTEGER NOT NULL,
    "customerRetentionScore" INTEGER NOT NULL,
    "recurringRevenueQualityScore" INTEGER NOT NULL,
    "strategicFitScore" INTEGER NOT NULL,
    "verticalAttractivenessScore" INTEGER NOT NULL,
    "sellerWillingnessScore" INTEGER NOT NULL,
    "keyRisksScore" INTEGER NOT NULL,
    "valuationReturnsScore" INTEGER NOT NULL,
    "financialAttractivenessNotes" TEXT,
    "customerRetentionNotes" TEXT,
    "recurringRevenueQualityNotes" TEXT,
    "strategicFitNotes" TEXT,
    "verticalAttractivenessNotes" TEXT,
    "sellerWillingnessNotes" TEXT,
    "keyRisksNotes" TEXT,
    "valuationReturnsNotes" TEXT,
    "overallScore" DECIMAL(65,30) NOT NULL,
    "scoringMethodVersion" TEXT NOT NULL DEFAULT 'v1',
    "scoredById" TEXT NOT NULL,
    "scoredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scorecard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcquisitionThesis" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "whyCompanyAttractive" TEXT,
    "whyVerticalAttractive" TEXT,
    "synergies" TEXT,
    "keyRisks" TEXT,
    "whyOwnerMightSell" TEXT,
    "whyNow" TEXT,
    "recommendedNextAction" TEXT,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcquisitionThesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerRelationship" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "ownerName" TEXT,
    "ownerAge" INTEGER,
    "yearsOwned" INTEGER,
    "expectedSuccessionTimeline" "SuccessionTimeline",
    "successorIdentified" "SuccessorStatus",
    "ownershipChangeHistory" TEXT,
    "sellerStatedObjectives" TEXT,
    "sellerPriceExpectationLow" DECIMAL(65,30),
    "sellerPriceExpectationHigh" DECIMAL(65,30),
    "sellerWillingnessNotes" TEXT,
    "otherSuccessionSignals" TEXT,
    "lastReviewedById" TEXT,
    "lastReviewedAt" TIMESTAMP(3),

    CONSTRAINT "SellerRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectForecast" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "forecastedRevenueGrowthPct" DECIMAL(65,30),
    "forecastedARR" DECIMAL(65,30),
    "forecastedEBITDA" DECIMAL(65,30),
    "forecastedEBITDAMargin" DECIMAL(65,30),
    "marginImprovementOpportunity" TEXT,
    "marginImprovementPts" DECIMAL(65,30),
    "keyAssumptions" TEXT,
    "horizonYears" INTEGER,
    "createdById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspectForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValuationAnalysis" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "indicativePriceRangeLow" DECIMAL(65,30),
    "indicativePriceRangeHigh" DECIMAL(65,30),
    "revenueMultipleLow" DECIMAL(65,30),
    "revenueMultipleHigh" DECIMAL(65,30),
    "ebitdaMultipleLow" DECIMAL(65,30),
    "ebitdaMultipleHigh" DECIMAL(65,30),
    "forecastedPurchasePrice" DECIMAL(65,30),
    "expectedROCE" DECIMAL(65,30),
    "valuationNotes" TEXT,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValuationAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingActivity" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "activityDate" TIMESTAMP(3) NOT NULL,
    "contactedById" TEXT NOT NULL,
    "contactPersonName" TEXT,
    "resultedInResponse" BOOLEAN NOT NULL DEFAULT false,
    "outcomeNotes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldSource" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceDetail" TEXT,
    "reportingPeriod" TEXT,
    "currency" TEXT,
    "confidence" DOUBLE PRECISION,
    "validationStatus" "ValidationStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vertical_name_key" ON "Vertical"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StageDefinition_name_key" ON "StageDefinition"("name");

-- CreateIndex
CREATE INDEX "Prospect_currentStageId_idx" ON "Prospect"("currentStageId");

-- CreateIndex
CREATE INDEX "Prospect_verticalId_idx" ON "Prospect"("verticalId");

-- CreateIndex
CREATE INDEX "Prospect_dealOwnerId_idx" ON "Prospect"("dealOwnerId");

-- CreateIndex
CREATE INDEX "ProspectStageHistory_prospectId_idx" ON "ProspectStageHistory"("prospectId");

-- CreateIndex
CREATE INDEX "ProspectStageHistory_stageId_idx" ON "ProspectStageHistory"("stageId");

-- CreateIndex
CREATE UNIQUE INDEX "Scorecard_prospectId_key" ON "Scorecard"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "AcquisitionThesis_prospectId_key" ON "AcquisitionThesis"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerRelationship_prospectId_key" ON "SellerRelationship"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectForecast_prospectId_key" ON "ProspectForecast"("prospectId");

-- CreateIndex
CREATE UNIQUE INDEX "ValuationAnalysis_prospectId_key" ON "ValuationAnalysis"("prospectId");

-- CreateIndex
CREATE INDEX "SourcingActivity_prospectId_idx" ON "SourcingActivity"("prospectId");

-- CreateIndex
CREATE INDEX "SourcingActivity_activityDate_idx" ON "SourcingActivity"("activityDate");

-- CreateIndex
CREATE UNIQUE INDEX "FieldSource_entityType_entityId_fieldName_key" ON "FieldSource"("entityType", "entityId", "fieldName");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "StageDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_dealOwnerId_fkey" FOREIGN KEY ("dealOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectStageHistory" ADD CONSTRAINT "ProspectStageHistory_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectStageHistory" ADD CONSTRAINT "ProspectStageHistory_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "StageDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectStageHistory" ADD CONSTRAINT "ProspectStageHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scorecard" ADD CONSTRAINT "Scorecard_scoredById_fkey" FOREIGN KEY ("scoredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcquisitionThesis" ADD CONSTRAINT "AcquisitionThesis_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcquisitionThesis" ADD CONSTRAINT "AcquisitionThesis_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRelationship" ADD CONSTRAINT "SellerRelationship_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerRelationship" ADD CONSTRAINT "SellerRelationship_lastReviewedById_fkey" FOREIGN KEY ("lastReviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectForecast" ADD CONSTRAINT "ProspectForecast_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectForecast" ADD CONSTRAINT "ProspectForecast_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationAnalysis" ADD CONSTRAINT "ValuationAnalysis_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValuationAnalysis" ADD CONSTRAINT "ValuationAnalysis_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingActivity" ADD CONSTRAINT "SourcingActivity_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingActivity" ADD CONSTRAINT "SourcingActivity_contactedById_fkey" FOREIGN KEY ("contactedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
