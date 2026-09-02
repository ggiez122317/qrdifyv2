<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('attendance_log_id')->nullable()->constrained()->nullOnDelete();
            $table->string('deduplication_key', 64)->unique();
            $table->string('recipient', 32);
            $table->string('event_type', 32);
            $table->text('message');
            $table->string('provider', 32)->default('huawei_router');
            $table->string('status', 24)->default('queued');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->text('provider_response')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'sms_deliveries_status_created_at_index');
            $table->index(['user_id', 'created_at'], 'sms_deliveries_user_created_at_index');
            $table->index(['attendance_log_id', 'status'], 'sms_deliveries_log_status_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_deliveries');
    }
};
