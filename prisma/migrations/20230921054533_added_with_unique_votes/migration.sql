/*
  Warnings:

  - A unique constraint covering the columns `[userId,postId]` on the table `Downvote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,postId]` on the table `Upvote` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Downvote_userId_postId_key" ON "Downvote"("userId", "postId");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_userId_postId_key" ON "Upvote"("userId", "postId");
