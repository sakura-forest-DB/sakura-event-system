-- CreateTable
CREATE TABLE "volunteers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orgName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "skills" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "applicationStartDate" DATETIME,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "signups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "volunteerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "availability" TEXT,
    "freq" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "memo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signups_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "signups_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "volunteer_tags" (
    "volunteerId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("volunteerId", "tagId"),
    CONSTRAINT "volunteer_tags_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "volunteer_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stall_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "tentWidth" REAL,
    "tentDepth" REAL,
    "tentHeight" REAL,
    "vehicleCount" INTEGER,
    "vehicleNumbers" TEXT,
    "rentalTables" INTEGER,
    "rentalChairs" INTEGER,
    "questions" TEXT,
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stall_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performer_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "rentalAmp" INTEGER,
    "rentalMic" INTEGER,
    "questions" TEXT,
    "eventId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "performer_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stallApplicationId" TEXT,
    "performerApplicationId" TEXT,
    CONSTRAINT "application_notes_stallApplicationId_fkey" FOREIGN KEY ("stallApplicationId") REFERENCES "stall_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "application_notes_performerApplicationId_fkey" FOREIGN KEY ("performerApplicationId") REFERENCES "performer_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_email_name_key" ON "volunteers"("email", "name");

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
