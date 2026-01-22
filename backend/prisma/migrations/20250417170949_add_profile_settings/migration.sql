-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FontSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateTable
CREATE TABLE "ProfileSettings" (
    "id" TEXT NOT NULL,
    "themePreference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "fontSize" "FontSize" NOT NULL DEFAULT 'MEDIUM',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSettings_userId_key" ON "ProfileSettings"("userId");

-- CreateIndex
CREATE INDEX "ProfileSettings_userId_idx" ON "ProfileSettings"("userId");

-- AddForeignKey
ALTER TABLE "ProfileSettings" ADD CONSTRAINT "ProfileSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
