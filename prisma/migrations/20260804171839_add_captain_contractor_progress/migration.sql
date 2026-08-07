-- CreateTable
CREATE TABLE "ContractorApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractorId" TEXT NOT NULL,
    "licenseFilePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewNote" TEXT,
    CONSTRAINT "ContractorApplication_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractorApplicationCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "ContractorApplicationCategory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "ContractorApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContractorApplicationCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "deliveryReported" INTEGER NOT NULL DEFAULT 0,
    "deliveryApproved" INTEGER NOT NULL DEFAULT 0,
    "siteReported" INTEGER NOT NULL DEFAULT 0,
    "siteApproved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProgress_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SiteInspectionRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "note" TEXT,
    "scheduledAt" DATETIME,
    "captainNote" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteInspectionRequest_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "requestedPercent" INTEGER NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "PaymentClaim_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractorApplication_contractorId_key" ON "ContractorApplication"("contractorId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractorApplicationCategory_applicationId_categoryId_key" ON "ContractorApplicationCategory"("applicationId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProgress_quoteId_key" ON "ProjectProgress"("quoteId");
