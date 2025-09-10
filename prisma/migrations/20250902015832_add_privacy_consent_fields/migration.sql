-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_performer_applications" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "originalPayload" TEXT,
    "originalSubmittedAt" DATETIME,
    CONSTRAINT "performer_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_performer_applications" ("address", "createdAt", "email", "eventId", "groupName", "id", "originalPayload", "originalSubmittedAt", "performance", "performerCount", "phone", "questions", "rentalAmp", "rentalMic", "representative", "slotCount", "updatedAt", "vehicleCount", "vehicleNumbers") SELECT "address", "createdAt", "email", "eventId", "groupName", "id", "originalPayload", "originalSubmittedAt", "performance", "performerCount", "phone", "questions", "rentalAmp", "rentalMic", "representative", "slotCount", "updatedAt", "vehicleCount", "vehicleNumbers" FROM "performer_applications";
DROP TABLE "performer_applications";
ALTER TABLE "new_performer_applications" RENAME TO "performer_applications";
CREATE TABLE "new_stall_applications" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "originalPayload" TEXT,
    "originalSubmittedAt" DATETIME,
    CONSTRAINT "stall_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_stall_applications" ("address", "boothCount", "boothType", "createdAt", "email", "eventId", "groupName", "id", "items", "originalPayload", "originalSubmittedAt", "phone", "priceRangeMax", "priceRangeMin", "questions", "rentalChairs", "rentalTables", "representative", "tentDepth", "tentHeight", "tentWidth", "vehicleCount", "vehicleNumbers") SELECT "address", "boothCount", "boothType", "createdAt", "email", "eventId", "groupName", "id", "items", "originalPayload", "originalSubmittedAt", "phone", "priceRangeMax", "priceRangeMin", "questions", "rentalChairs", "rentalTables", "representative", "tentDepth", "tentHeight", "tentWidth", "vehicleCount", "vehicleNumbers" FROM "stall_applications";
DROP TABLE "stall_applications";
ALTER TABLE "new_stall_applications" RENAME TO "stall_applications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
