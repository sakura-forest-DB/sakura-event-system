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
    "originalPayload" TEXT,
    "originalSubmittedAt" DATETIME,
    CONSTRAINT "performer_applications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_performer_applications" ("address", "createdAt", "email", "eventId", "groupName", "id", "originalPayload", "originalSubmittedAt", "performance", "performerCount", "phone", "questions", "rentalAmp", "rentalMic", "representative", "slotCount", "vehicleCount", "vehicleNumbers") SELECT "address", "createdAt", "email", "eventId", "groupName", "id", "originalPayload", "originalSubmittedAt", "performance", "performerCount", "phone", "questions", "rentalAmp", "rentalMic", "representative", "slotCount", "vehicleCount", "vehicleNumbers" FROM "performer_applications";
DROP TABLE "performer_applications";
ALTER TABLE "new_performer_applications" RENAME TO "performer_applications";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
