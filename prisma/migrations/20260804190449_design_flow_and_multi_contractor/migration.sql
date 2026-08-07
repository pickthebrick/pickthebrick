-- CreateTable
CREATE TABLE "ProjectContractor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "deliveryReported" INTEGER NOT NULL DEFAULT 0,
    "deliveryApproved" INTEGER NOT NULL DEFAULT 0,
    "siteReported" INTEGER NOT NULL DEFAULT 0,
    "siteApproved" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectContractor_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectContractor_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProjectContractor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DesignRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "packageKey" TEXT NOT NULL,
    "sqft" REAL NOT NULL,
    "spaces" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "designerId" TEXT,
    "designerNote" TEXT,
    "siteVisitRequested" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "assignedAt" DATETIME,
    "deliveredAt" DATETIME,
    CONSTRAINT "DesignRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DesignRequest_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DesignRequest" ("assignedAt", "clientId", "createdAt", "deliveredAt", "designerId", "designerNote", "id", "packageKey", "spaces", "sqft", "status", "submittedAt") SELECT "assignedAt", "clientId", "createdAt", "deliveredAt", "designerId", "designerNote", "id", "packageKey", "spaces", "sqft", "status", "submittedAt" FROM "DesignRequest";
DROP TABLE "DesignRequest";
ALTER TABLE "new_DesignRequest" RENAME TO "DesignRequest";
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "location" TEXT,
    "officeSize" TEXT,
    "captainId" TEXT,
    "contractorId" TEXT,
    "materialsTotal" REAL NOT NULL DEFAULT 0,
    "installTotal" REAL NOT NULL DEFAULT 0,
    "grandTotal" REAL NOT NULL DEFAULT 0,
    "siteVisitFee" REAL NOT NULL DEFAULT 0,
    "referenceNumber" TEXT,
    "paymentMethod" TEXT,
    "paymentMethodSelectedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" DATETIME,
    "confirmedAt" DATETIME,
    "approvedAt" DATETIME,
    "paidAt" DATETIME,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("approvedAt", "captainId", "clientId", "confirmedAt", "contractorId", "createdAt", "grandTotal", "id", "installTotal", "location", "materialsTotal", "officeSize", "paidAt", "status", "submittedAt") SELECT "approvedAt", "captainId", "clientId", "confirmedAt", "contractorId", "createdAt", "grandTotal", "id", "installTotal", "location", "materialsTotal", "officeSize", "paidAt", "status", "submittedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_referenceNumber_key" ON "Quote"("referenceNumber");
CREATE TABLE "new_QuoteItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "categoryLabel" TEXT NOT NULL,
    "typeLabel" TEXT NOT NULL,
    "subtypeLabel" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "installRate" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "qty" REAL NOT NULL,
    "amount" REAL NOT NULL,
    CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuoteItem" ("amount", "categoryLabel", "id", "installRate", "name", "productId", "qty", "quoteId", "rate", "subtypeLabel", "typeLabel", "unit") SELECT "amount", "categoryLabel", "id", "installRate", "name", "productId", "qty", "quoteId", "rate", "subtypeLabel", "typeLabel", "unit" FROM "QuoteItem";
DROP TABLE "QuoteItem";
ALTER TABLE "new_QuoteItem" RENAME TO "QuoteItem";
CREATE UNIQUE INDEX "QuoteItem_quoteId_productId_key" ON "QuoteItem"("quoteId", "productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContractor_quoteId_categoryId_key" ON "ProjectContractor"("quoteId", "categoryId");
