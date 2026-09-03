-- CreateTable
CREATE TABLE "AuditLog" (
    "audit_log_id" SERIAL NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "target_id" VARCHAR(255),
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateIndex
CREATE INDEX "AuditLog_actor_id_idx" ON "AuditLog"("actor_id");

-- CreateIndex
CREATE INDEX "AuditLog_created_at_idx" ON "AuditLog"("created_at");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
