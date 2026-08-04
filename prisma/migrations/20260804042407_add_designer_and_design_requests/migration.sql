-- CreateTable
CREATE TABLE "DesignRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "packageKey" TEXT NOT NULL,
    "sqft" REAL NOT NULL,
    "spaces" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "designerId" TEXT,
    "designerNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "assignedAt" DATETIME,
    "deliveredAt" DATETIME,
    CONSTRAINT "DesignRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DesignRequest_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignRequestFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "designRequestId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DesignRequestFile_designRequestId_fkey" FOREIGN KEY ("designRequestId") REFERENCES "DesignRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
