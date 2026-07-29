<?php

namespace Database\Seeders;

use App\Models\School;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        School::create([
            'name' => 'Trento West Central Elementary School',
            'type' => 'Elementary',
            'latitude' => 8.0461,
            'longitude' => 126.0623,
            'student_count' => 412,
            'status' => 'Active',
            'geofence_area' => 0.85,
            'boundary' => [
                ['lat' => 8.0461, 'lng' => 126.0617],
                ['lat' => 8.0461, 'lng' => 126.0627],
                ['lat' => 8.0453, 'lng' => 126.0629],
                ['lat' => 8.0451, 'lng' => 126.0619],
            ],
        ]);

        School::create([
            'name' => 'Trento Central Elementary School',
            'type' => 'Elementary',
            'latitude' => 8.0480,
            'longitude' => 126.0650,
            'student_count' => 356,
            'status' => 'Active',
            'geofence_area' => 1.20,
        ]);

        School::create([
            'name' => 'Trento National High School',
            'type' => 'Secondary',
            'latitude' => 8.0495,
            'longitude' => 126.0600,
            'student_count' => 890,
            'status' => 'Active',
            'geofence_area' => 2.10,
        ]);

        School::create([
            'name' => 'Agusan del Sur State College of Agriculture and Technology',
            'type' => 'Tertiary',
            'latitude' => 8.0440,
            'longitude' => 126.0580,
            'student_count' => 1248,
            'status' => 'Active',
            'geofence_area' => 5.50,
        ]);

        School::create([
            'name' => 'Trento Central Elementary School (Annex)',
            'type' => 'Elementary',
            'latitude' => 8.0500,
            'longitude' => 126.0680,
            'student_count' => 189,
            'status' => 'Active',
            'geofence_area' => 0.45,
        ]);
    }
}