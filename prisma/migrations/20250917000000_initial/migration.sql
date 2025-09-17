-- CreateTable
CREATE TABLE "volunteers" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "skills" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "applicationStartDate" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signups" (
    "id" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "availability" TEXT,
    "freq" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_tags" (
    "volunteerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "volunteer_tags_pkey" PRIMARY KEY ("volunteerId","tagId")
);

-- CreateTable
CREATE TABLE "stall_applications" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "representative" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "boothType" TEXT NOT NULL,
    "items" TEXT,
    "priceRangeMin" INTEGER,
    "priceRangeMax" INTEGER,
    "boothCount" INTEGER,
    "tentWidth" DOUBLE PRECISION,
    "tentDepth" DOUBLE PRECISION,
    "tentHeight" DOUBLE PRECISION,
    "vehicleCount" INTEGER,
    "vehicleType" TEXT,
    "vehicleNumbers" TEXT,
    "rentalTables" INTEGER,
    "rentalChairs" INTEGER,
    "questions" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "originalPayload" TEXT,
    "originalSubmittedAt" TIMESTAMP(3),

    CONSTRAINT "stall_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performer_applications" (
    "id" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "representative" TEXT NOT NULL,
    "address" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "performance" TEXT NOT NULL,
    "performerCount" INTEGER,
    "slotCount" INTEGER,
    "vehicleCount" INTEGER,
    "vehicleNumbers" TEXT,
    "audioSourceOnly" INTEGER,
    "rentalAmp" INTEGER,
    "rentalMic" INTEGER,
    "questions" TEXT,
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "originalPayload" TEXT,
    "originalSubmittedAt" TIMESTAMP(3),

    CONSTRAINT "performer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_logs" (
    "id" SERIAL NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT NOT NULL,
    "editor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stallApplicationId" TEXT,
    "performerApplicationId" TEXT,
    "volunteerId" TEXT,

    CONSTRAINT "change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_email_name_key" ON "volunteers"("email", "name");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "change_logs_entity_entityId_createdAt_idx" ON "change_logs"("entity", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "signups" ADD CONSTRAINT "signups_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signups" ADD CONSTRAINT "signups_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_tags" ADD CONSTRAINT "volunteer_tags_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_tags" ADD CONSTRAINT "volunteer_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stall_applications" ADD CONSTRAINT "stall_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performer_applications" ADD CONSTRAINT "performer_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_stallApplicationId_fkey" FOREIGN KEY ("stallApplicationId") REFERENCES "stall_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_performerApplicationId_fkey" FOREIGN KEY ("performerApplicationId") REFERENCES "performer_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;