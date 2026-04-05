CREATE TABLE "NotificationDelivery" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "timeBlockId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationDelivery_userId_timeBlockId_channel_type_key"
ON "NotificationDelivery"("userId", "timeBlockId", "channel", "type");

CREATE INDEX "NotificationDelivery_timeBlockId_idx"
ON "NotificationDelivery"("timeBlockId");

CREATE INDEX "NotificationDelivery_userId_idx"
ON "NotificationDelivery"("userId");

ALTER TABLE "NotificationDelivery"
ADD CONSTRAINT "NotificationDelivery_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationDelivery"
ADD CONSTRAINT "NotificationDelivery_timeBlockId_fkey"
FOREIGN KEY ("timeBlockId") REFERENCES "TimeBlock"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
