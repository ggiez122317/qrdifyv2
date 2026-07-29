<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ScanCacheService
{
    private const CACHE_KEY = 'scan_directory';

    public function warm(): void
    {
        $users = User::select('users.id', 'users.name', 'users.photo_url')
            ->join('model_has_roles', function ($join) {
                $join->on('model_has_roles.model_id', '=', 'users.id')
                     ->where('model_has_roles.model_type', User::class);
            })
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->whereIn('roles.name', ['student', 'teacher'])
            ->selectRaw('roles.name as role_name')
            ->get()
            ->keyBy('id');

        $studentIds = $users->filter(fn($u) => $u->role_name === 'student')->pluck('id');
        $teacherIds = $users->filter(fn($u) => $u->role_name === 'teacher')->pluck('id');

        $studentProfiles = [];
        if ($studentIds->isNotEmpty()) {
            $studentProfiles = DB::table('student_profiles')
                ->whereIn('user_id', $studentIds)
                ->get(['user_id', 'grade', 'section', 'teacher_id', 'parent_phone'])
                ->keyBy('user_id');
        }

        $teacherProfiles = [];
        if ($teacherIds->isNotEmpty()) {
            $teacherProfiles = DB::table('teacher_profiles')
                ->whereIn('user_id', $teacherIds)
                ->get(['user_id', 'subject', 'contact_number'])
                ->keyBy('user_id');
        }

        $idNumbers = User::whereIn('id', $users->keys())
            ->pluck('id_number', 'id');

        $directory = [];

        foreach ($users as $userId => $user) {
            $idNumber = $idNumbers[$userId] ?? null;
            if (!$idNumber) {
                continue;
            }

            $entry = [
                'id'         => $userId,
                'name'       => $user->name,
                'photo_url'  => $user->photo_url,
                'role'       => $user->role_name,
            ];

            if ($user->role_name === 'student') {
                $profile = $studentProfiles[$userId] ?? null;
                $entry['grade']        = $profile?->grade;
                $entry['section']      = $profile?->section;
                $entry['teacher_id']   = $profile?->teacher_id;
                $entry['parent_phone'] = $profile?->parent_phone;
            } else {
                $profile = $teacherProfiles[$userId] ?? null;
                $entry['subject']        = $profile?->subject;
                $entry['contact_number'] = $profile?->contact_number;
            }

            $directory[$idNumber] = $entry;
        }

        Cache::forever(self::CACHE_KEY, $directory);
    }

    public function find(string $idNumber): ?array
    {
        $directory = Cache::get(self::CACHE_KEY);

        if ($directory === null) {
            $this->warm();
            $directory = Cache::get(self::CACHE_KEY);
        }

        return $directory[$idNumber] ?? null;
    }

    public function all(): array
    {
        $directory = Cache::get(self::CACHE_KEY);

        if ($directory === null) {
            $this->warm();
            $directory = Cache::get(self::CACHE_KEY);
        }

        return $directory;
    }

    public function invalidate(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}