-- AlterTable
ALTER TABLE "Certification" ADD COLUMN     "certificateUrl" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "schoolName" TEXT;
