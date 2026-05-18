-- Create ParentProfile table
CREATE TABLE IF NOT EXISTS "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId
CREATE UNIQUE INDEX IF NOT EXISTS "ParentProfile_userId_key" ON "ParentProfile"("userId");

-- Add foreign key to User
ALTER TABLE "ParentProfile" ADD CONSTRAINT "ParentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add parentId column to Student if it doesn't exist
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- Add foreign key for parentId in Student table
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;