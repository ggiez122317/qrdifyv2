<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->string('grade_level')->nullable()->after('subject');
            $table->foreignId('section_id')->nullable()->after('grade_level')
                ->constrained('sections')->nullOnDelete();
            $table->boolean('email_notifications')->default(true)->after('section_id');
            $table->boolean('sms_notifications')->default(false)->after('email_notifications');
        });
    }

    public function down(): void
    {
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropForeign(['section_id']);
            $table->dropColumn([
                'grade_level',
                'section_id',
                'email_notifications',
                'sms_notifications',
            ]);
        });
    }
};
