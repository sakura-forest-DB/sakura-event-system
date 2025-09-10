-- AlterTable
ALTER TABLE "performer_applications" ADD COLUMN "originalPayload" TEXT;
ALTER TABLE "performer_applications" ADD COLUMN "originalSubmittedAt" DATETIME;

-- AlterTable
ALTER TABLE "stall_applications" ADD COLUMN "originalPayload" TEXT;
ALTER TABLE "stall_applications" ADD COLUMN "originalSubmittedAt" DATETIME;

-- CreateTable
CREATE TABLE "change_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT NOT NULL,
    "editor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "change_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "stall_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "change_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "performer_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "change_logs_entity_entityId_createdAt_idx" ON "change_logs"("entity", "entityId", "createdAt");
