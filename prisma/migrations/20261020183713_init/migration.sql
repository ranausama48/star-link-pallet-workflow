-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facility" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "primaryCompanyId" TEXT NOT NULL,

    CONSTRAINT "Facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityCompany" (
    "facilityId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "FacilityCompany_pkey" PRIMARY KEY ("facilityId","companyId")
);

-- CreateTable
CREATE TABLE "PalletType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "lengthCm" DOUBLE PRECISION NOT NULL,
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "tareWeightKg" DOUBLE PRECISION NOT NULL,
    "maxLoadKg" DOUBLE PRECISION NOT NULL,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "PalletType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocRefType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "patternMask" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "DocRefType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "hasAppPassword" BOOLEAN NOT NULL DEFAULT false,
    "assignedFaco" JSONB NOT NULL,
    "screenPermissions" JSONB NOT NULL,
    "oracleVerified" BOOLEAN NOT NULL DEFAULT false,
    "oracleVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OracleWmsUser" (
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "oracleRole" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "OracleWmsUser_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "OracleWmsConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "config" JSONB NOT NULL,

    CONSTRAINT "OracleWmsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalletTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceLabel" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "companyCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,
    "facilityCode" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "docRefTypeId" TEXT NOT NULL,
    "docRefTypeName" TEXT NOT NULL,
    "docRefNumber" TEXT NOT NULL,
    "palletTypeId" TEXT NOT NULL,
    "palletTypeCode" TEXT NOT NULL,
    "palletTypeName" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT NOT NULL,
    "createdByUsername" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON "Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Facility_code_key" ON "Facility"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PalletType_code_key" ON "PalletType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DocRefType_code_key" ON "DocRefType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");

-- CreateIndex
CREATE INDEX "PalletTransaction_facilityId_palletTypeId_timestamp_idx" ON "PalletTransaction"("facilityId", "palletTypeId", "timestamp");

-- CreateIndex
CREATE INDEX "PalletTransaction_type_idx" ON "PalletTransaction"("type");

-- CreateIndex
CREATE INDEX "PalletTransaction_companyId_idx" ON "PalletTransaction"("companyId");

-- AddForeignKey
ALTER TABLE "Facility" ADD CONSTRAINT "Facility_primaryCompanyId_fkey" FOREIGN KEY ("primaryCompanyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityCompany" ADD CONSTRAINT "FacilityCompany_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityCompany" ADD CONSTRAINT "FacilityCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalletTransaction" ADD CONSTRAINT "PalletTransaction_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "Facility"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalletTransaction" ADD CONSTRAINT "PalletTransaction_palletTypeId_fkey" FOREIGN KEY ("palletTypeId") REFERENCES "PalletType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalletTransaction" ADD CONSTRAINT "PalletTransaction_docRefTypeId_fkey" FOREIGN KEY ("docRefTypeId") REFERENCES "DocRefType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
