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
        Schema::table('excuse_letters', function (Blueprint $table) {
            $table->string('title')->after('teacher_id');
            $table->date('absent_date')->after('title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('excuse_letters', function (Blueprint $table) {
            $table->dropColumn(['title', 'absent_date']);
        });
    }
};
