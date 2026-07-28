<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        // 1. Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@school.com'],
            ['name' => 'Super Admin', 'password' => $password]
        );
        if (!$superAdmin->hasRole('super-admin')) {
            $superAdmin->assignRole('super-admin');
        }

        // 2. Principal
        $principal = User::firstOrCreate(
            ['email' => 'principal@school.com'],
            ['name' => 'Principal John', 'password' => $password]
        );
        if (!$principal->hasRole('principal')) {
            $principal->assignRole('principal');
        }

        // 3. Teacher
        $teacher = User::firstOrCreate(
            ['email' => 'teacher@school.com'],
            [
                'name' => 'Teacher Mary',
                'id_number' => '200001',
                'password' => $password,
            ]
        );
        if (!$teacher->hasRole('teacher')) {
            $teacher->assignRole('teacher');
        }
        TeacherProfile::firstOrCreate(
            ['user_id' => $teacher->id],
            ['subject' => 'Science', 'contact_number' => '09123456789']
        );

        // 4. Guard
        $guard = User::firstOrCreate(
            ['email' => 'guard@school.com'],
            ['name' => 'Guard Bob', 'password' => $password]
        );
        if (!$guard->hasRole('guard')) {
            $guard->assignRole('guard');
        }

        // 5. Student
        $student = User::firstOrCreate(
            ['email' => 'student@school.com'],
            [
                'name' => 'Student Alex',
                'id_number' => '100001',
                'password' => $password,
            ]
        );
        if (!$student->hasRole('student')) {
            $student->assignRole('student');
        }
        StudentProfile::updateOrCreate(
            ['user_id' => $student->id],
            [
                'grade' => 'Grade 10',
                'section' => 'A',
                'parent_phone' => '09987654321',
                'teacher_id' => $teacher->id,
            ]
        );
    }
}
