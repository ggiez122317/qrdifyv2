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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['class', 'personal'])->default('personal');
            $table->string('title');
            $table->string('description')->nullable();
            
            // For class schedules that repeat weekly
            $table->integer('day_of_week')->nullable(); // 0=Sunday, 1=Monday...
            
            // For personal one-off alarms
            $table->date('date')->nullable();
            
            $table->time('start_time');
            $table->time('end_time')->nullable();
            
            $table->boolean('is_alarm')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
