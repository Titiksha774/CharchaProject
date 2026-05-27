-- CreateEnum
CREATE TYPE "PostMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "media_url" TEXT;
ALTER TABLE "posts" ADD COLUMN "media_type" "PostMediaType";

-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN "content_iv" TEXT;
ALTER TABLE "direct_messages" ADD COLUMN "content_tag" TEXT;
