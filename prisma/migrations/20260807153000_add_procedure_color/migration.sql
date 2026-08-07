-- CreateEnum
CREATE TYPE "ProcedureColor" AS ENUM ('GREEN', 'BLUE', 'ORANGE', 'PURPLE', 'PINK', 'GRAY');

-- AlterTable
ALTER TABLE "ProcedureType" ADD COLUMN "color" "ProcedureColor" NOT NULL DEFAULT 'GRAY';
