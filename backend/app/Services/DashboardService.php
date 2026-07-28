<?php

namespace App\Services;

use App\Models\User;
use App\Models\ActivityLog;
use App\Models\Attendance;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    private const CACHE_TTL = 300; // 5 minutes

    public function getAdminDashboard(): array
    {
        $cacheKey = 'dashboard_admin_' . now()->format('Y-m-d_H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            $totalUsers = User::count();
            $usersLastWeek = User::where('created_at', '<', now()->subWeek())->count();
            $usersIncrease = $usersLastWeek > 0
                ? round((($totalUsers - $usersLastWeek) / $usersLastWeek) * 100)
                : 0;

            $totalLogs = ActivityLog::count();
            $logsLastWeek = ActivityLog::where('created_at', '<', now()->subWeek())->count();
            $logsIncrease = $logsLastWeek > 0
                ? round((($totalLogs - $logsLastWeek) / $logsLastWeek) * 100)
                : 0;

            $isMaintenanceMode = Cache::get('maintenance_mode', false);
            $systemHealth = $isMaintenanceMode ? 0 : 99;

            $activeModules = ActivityLog::where('created_at', '>=', now()->subWeek())
                ->distinct('action')
                ->count('action');

            $activityData = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $count = ActivityLog::whereDate('created_at', $date)->count();
                $activityData[] = [
                    'name' => $date->format('D'),
                    'value' => $count,
                ];
            }

            $roles = ['student', 'teacher', 'super-admin', 'guard', 'principal'];
            $colors = ['#8b5cf6', '#14b8a6', '#eab308', '#ec4899', '#3b82f6'];
            $rolesData = [];
            foreach ($roles as $index => $roleName) {
                $count = User::role($roleName)->count();
                if ($count > 0) {
                    $displayName = $roleName === 'super-admin' ? 'Admins' : ucfirst($roleName) . 's';
                    $rolesData[] = [
                        'name' => $displayName,
                        'value' => $count,
                        'color' => $colors[$index % count($colors)],
                    ];
                }
            }

            $totalStudents = User::role('student')->count();
            $totalTeachers = User::role('teacher')->count();

            $modules = [
                ['name' => 'Student Management', 'desc' => 'Records & Profiles', 'progress' => $totalStudents > 0 ? 100 : 0, 'color' => 'bg-purple-500', 'text' => 'text-purple-500', 'bg' => 'bg-purple-50 dark:bg-purple-500/10'],
                ['name' => 'Teacher Management', 'desc' => 'Staff Records', 'progress' => $totalTeachers > 0 ? 100 : 0, 'color' => 'bg-teal-500', 'text' => 'text-teal-500', 'bg' => 'bg-teal-50 dark:bg-teal-500/10'],
                ['name' => 'System Logs', 'desc' => 'Audit Trails', 'progress' => $totalLogs > 0 ? 80 : 0, 'color' => 'bg-yellow-500', 'text' => 'text-yellow-500', 'bg' => 'bg-yellow-50 dark:bg-yellow-500/10'],
                ['name' => 'Security Controls', 'desc' => 'Access & Permissions', 'progress' => 100, 'color' => 'bg-pink-500', 'text' => 'text-pink-500', 'bg' => 'bg-pink-50 dark:bg-pink-500/10'],
            ];

            $recentLogs = ActivityLog::with('user:id,name')->orderBy('created_at', 'desc')->take(4)->get()
                ->map(fn($log) => [
                    'name' => $log->user->name ?? 'System',
                    'action' => $log->action,
                    'time' => $log->created_at->diffForHumans(),
                ]);

            return [
                'stats' => [
                    'total_users' => $totalUsers,
                    'users_increase' => $usersIncrease,
                    'active_modules_pct' => min(100, (int) round(($activeModules / max(1, $totalLogs)) * 100)),
                    'system_health' => $systemHealth,
                    'total_logs' => $totalLogs,
                    'logs_increase' => $logsIncrease,
                ],
                'activity_data' => $activityData,
                'roles_data' => $rolesData,
                'modules_performance' => $modules,
                'recent_logs' => $recentLogs,
            ];
        });
    }

    public function getStudentStats(): array
    {
        $cacheKey = 'stats_student_' . now()->format('Y-m-d_H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            $totalStudents = User::students()->count();
            $newThisMonth = User::students()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $today = now()->toDateString();
            $presentToday = Attendance::forDate($today)
                ->whereHas('user', fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'student')))
                ->whereIn('status', ['present', 'late'])
                ->count();

            $attendanceRate = $totalStudents > 0 ? round(($presentToday / $totalStudents) * 100, 1) : 0;

            $startDate = now()->subDays(6)->toDateString();
            $trend = Attendance::where('date', '>=', $startDate)
                ->whereHas('user', fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'student')))
                ->whereIn('status', ['present', 'late'])
                ->selectRaw('date, COUNT(*) as value')
                ->groupBy('date')
                ->pluck('value', 'date');

            // Single query for new student sparkline data instead of 7 queries in a loop
            $startDate7 = now()->subDays(6)->toDateString();
            $newByDate = User::students()
                ->where('created_at', '>=', $startDate7)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupByRaw('DATE(created_at)')
                ->pluck('count', 'date');

            $sparklines = ['total' => [], 'attendance' => [], 'new' => []];
            for ($i = 6; $i >= 0; $i--) {
                $dateStr = now()->subDays($i)->toDateString();
                $sparklines['total'][] = $totalStudents;
                $attCount = (int) $trend->get($dateStr, 0);
                $sparklines['attendance'][] = $totalStudents > 0 ? round(($attCount / $totalStudents) * 100, 1) : 0;
                $sparklines['new'][] = (int) ($newByDate->get($dateStr, 0));
            }

            return compact('totalStudents', 'attendanceRate', 'newThisMonth', 'sparklines');
        });
    }

    public function getTeacherStats(): array
    {
        $cacheKey = 'stats_teacher_' . now()->format('Y-m-d_H');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            $totalTeachers = User::teachers()->count();
            $newThisMonth = User::teachers()
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count();

            $today = now()->toDateString();
            $presentToday = Attendance::forDate($today)
                ->whereHas('user', fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'teacher')))
                ->whereIn('status', ['present', 'late'])
                ->count();

            $attendanceRate = $totalTeachers > 0 ? round(($presentToday / $totalTeachers) * 100, 1) : 0;

            $startDate = now()->subDays(6)->toDateString();
            $trend = Attendance::where('date', '>=', $startDate)
                ->whereHas('user', fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'teacher')))
                ->whereIn('status', ['present', 'late'])
                ->selectRaw('date, COUNT(*) as value')
                ->groupBy('date')
                ->pluck('value', 'date');

            // Single query for new teacher sparkline data instead of 7 queries in a loop
            $startDate7 = now()->subDays(6)->toDateString();
            $newByDate = User::teachers()
                ->where('created_at', '>=', $startDate7)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupByRaw('DATE(created_at)')
                ->pluck('count', 'date');

            $sparklines = ['total' => [], 'attendance' => [], 'new' => []];
            for ($i = 6; $i >= 0; $i--) {
                $dateStr = now()->subDays($i)->toDateString();
                $sparklines['total'][] = $totalTeachers;
                $attCount = (int) $trend->get($dateStr, 0);
                $sparklines['attendance'][] = $totalTeachers > 0 ? round(($attCount / $totalTeachers) * 100, 1) : 0;
                $sparklines['new'][] = (int) ($newByDate->get($dateStr, 0));
            }

            return compact('totalTeachers', 'attendanceRate', 'newThisMonth', 'sparklines');
        });
    }
}
