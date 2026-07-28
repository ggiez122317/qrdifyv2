<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Performance indexes for 4,000+ user scale.
     *
     * These cover the hottest query paths:
     * - RFID scan lookup (users.id_number)
     * - Daily attendance check (attendances.user_id + date)
     * - Stats aggregation (attendances.date + status)
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->index(['user_id', 'date'], 'idx_attendance_user_date');
            $table->index(['date', 'status'], 'idx_attendance_date_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('id_number', 'idx_users_id_number');
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->index('created_at', 'idx_announcements_created_at');
        });

        Schema::table('notices', function (Blueprint $table) {
            $table->index(['principal_id', 'created_at'], 'idx_notices_principal_created');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropIndex('idx_attendance_user_date');
            $table->dropIndex('idx_attendance_date_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_id_number');
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex('idx_announcements_created_at');
        });

        Schema::table('notices', function (Blueprint $table) {
            $table->dropIndex('idx_notices_principal_created');
        });
    }
};
