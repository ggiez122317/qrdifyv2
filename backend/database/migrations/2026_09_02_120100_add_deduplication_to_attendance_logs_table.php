<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->string('status', 24)->nullable()->after('type');
            $table->string('idempotency_key', 64)->nullable()->unique()->after('scanned_at');
            $table->string('scan_source', 64)->nullable()->after('idempotency_key');
            $table->index(
                ['user_id', 'scanned_at'],
                'attendance_logs_user_scanned_at_index',
            );
        });
    }

    public function down(): void
    {
        Schema::table('attendance_logs', function (Blueprint $table) {
            $table->dropIndex('attendance_logs_user_scanned_at_index');
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn(['status', 'idempotency_key', 'scan_source']);
        });
    }
};
