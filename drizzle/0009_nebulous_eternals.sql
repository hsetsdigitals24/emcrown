CREATE TABLE "emcrown_admin"."notification_delivery" (
	"message_id" uuid PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notification_delivery_status" CHECK ("emcrown_admin"."notification_delivery"."status" in ('delivered', 'bounced', 'complained'))
);
--> statement-breakpoint
ALTER TABLE "emcrown_admin"."notification_delivery" ADD CONSTRAINT "notification_delivery_message_id_appointment_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "emcrown_admin"."appointment_messages"("id") ON DELETE no action ON UPDATE no action;