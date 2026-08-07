-- CreateTable
CREATE TABLE "DesignRequestSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designRequestId" TEXT NOT NULL,
    "spaceKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    CONSTRAINT "DesignRequestSpace_designRequestId_fkey" FOREIGN KEY ("designRequestId") REFERENCES "DesignRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignRequestSpaceAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designRequestSpaceId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "DesignRequestSpaceAnswer_designRequestSpaceId_fkey" FOREIGN KEY ("designRequestSpaceId") REFERENCES "DesignRequestSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignRequestSpaceAnswer_designRequestSpaceId_questionKey_key" ON "DesignRequestSpaceAnswer"("designRequestSpaceId", "questionKey");
