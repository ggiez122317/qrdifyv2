<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('Elementary');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('student_count')->default(0);
            $table->string('status')->default('Active');
            $table->decimal('geofence_area', 8, 2)->nullable()->comment('Area in km²');
            $table->text('boundary')->nullable()->comment('JSON array of lat/lng polygon points');
            $table->timestamps();
        });

        Artisan::call('db:seed', ['--class' => 'SchoolSeeder']);
    }

    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};