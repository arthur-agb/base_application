-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "edited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "editedById" TEXT,
ADD COLUMN     "parentCommentId" TEXT,
ADD COLUMN     "reactions" JSONB;

-- AlterTable
ALTER TABLE "History" ADD COLUMN     "changes" JSONB,
ADD COLUMN     "commentId" TEXT;

-- CreateIndex
CREATE INDEX "Comment_parentCommentId_idx" ON "Comment"("parentCommentId");

-- CreateIndex
CREATE INDEX "Comment_editedById_idx" ON "Comment"("editedById");

-- CreateIndex
CREATE INDEX "History_commentId_idx" ON "History"("commentId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
