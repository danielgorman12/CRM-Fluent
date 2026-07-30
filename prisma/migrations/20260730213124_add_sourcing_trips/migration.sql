-- CreateEnum
CREATE TYPE "DistanceUnit" AS ENUM ('MI', 'KM');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "radius" INTEGER NOT NULL,
    "unit" "DistanceUnit" NOT NULL,
    "perDay" INTEGER NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripVisit" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "loggedActivityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_createdById_idx" ON "Trip"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "TripVisit_loggedActivityId_key" ON "TripVisit"("loggedActivityId");

-- CreateIndex
CREATE INDEX "TripVisit_tripId_idx" ON "TripVisit"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "TripVisit_tripId_prospectId_key" ON "TripVisit"("tripId", "prospectId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripVisit" ADD CONSTRAINT "TripVisit_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripVisit" ADD CONSTRAINT "TripVisit_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripVisit" ADD CONSTRAINT "TripVisit_loggedActivityId_fkey" FOREIGN KEY ("loggedActivityId") REFERENCES "SourcingActivity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
