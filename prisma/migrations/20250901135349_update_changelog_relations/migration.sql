-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_change_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT NOT NULL,
    "editor" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stallApplicationId" TEXT,
    "performerApplicationId" TEXT,
    CONSTRAINT "change_logs_stallApplicationId_fkey" FOREIGN KEY ("stallApplicationId") REFERENCES "stall_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "change_logs_performerApplicationId_fkey" FOREIGN KEY ("performerApplicationId") REFERENCES "performer_applications" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_change_logs" ("createdAt", "editor", "entity", "entityId", "field", "id", "newValue", "oldValue", "reason") SELECT "createdAt", "editor", "entity", "entityId", "field", "id", "newValue", "oldValue", "reason" FROM "change_logs";
DROP TABLE "change_logs";
ALTER TABLE "new_change_logs" RENAME TO "change_logs";
CREATE INDEX "change_logs_entity_entityId_createdAt_idx" ON "change_logs"("entity", "entityId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
