-- AlterTable
ALTER TABLE "Brigade" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Brigade" ADD CONSTRAINT "Brigade_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Brigade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
