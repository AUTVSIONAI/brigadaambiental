-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LIXO', 'INCENDIO', 'DESMATAMENTO', 'CACA', 'POLUICAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RECEBIDA', 'TRIAGEM', 'EM_VERIFICACAO', 'CONFIRMADA', 'ENCERRADA');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "description" TEXT NOT NULL,
    "photos" TEXT[],
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "reporterUserId" TEXT,
    "reporterName" TEXT,
    "reporterContact" TEXT,
    "brigadeId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'RECEBIDA',
    "assignedToId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeClockSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brigadeId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "startLatitude" DOUBLE PRECISION,
    "startLongitude" DOUBLE PRECISION,
    "endLatitude" DOUBLE PRECISION,
    "endLongitude" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeClockSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_brigadeId_createdAt_idx" ON "Report"("brigadeId", "createdAt");

-- CreateIndex
CREATE INDEX "TimeClockSession_userId_startedAt_idx" ON "TimeClockSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "TimeClockSession_brigadeId_startedAt_idx" ON "TimeClockSession"("brigadeId", "startedAt");

-- CreateIndex
CREATE INDEX "TimeClockSession_endedAt_idx" ON "TimeClockSession"("endedAt");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_brigadeId_fkey" FOREIGN KEY ("brigadeId") REFERENCES "Brigade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeClockSession" ADD CONSTRAINT "TimeClockSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeClockSession" ADD CONSTRAINT "TimeClockSession_brigadeId_fkey" FOREIGN KEY ("brigadeId") REFERENCES "Brigade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
