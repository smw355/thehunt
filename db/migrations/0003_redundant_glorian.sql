ALTER TABLE "submissions" ALTER COLUMN "clue_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ALTER COLUMN "clue_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "clue_title" varchar(255);--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "photo_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;