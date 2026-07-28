<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('parent_name')->nullable()->after('section');
            $table->string('parent_phone')->nullable()->after('parent_name');
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->string('position')->nullable()->after('department');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn(['parent_name', 'parent_phone']);
        });

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
};
