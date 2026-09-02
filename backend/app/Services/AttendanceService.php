<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\AttendanceLog;
use App\Models\User;
use App\Notifications\StudentScannedNotification;

class AttendanceService
{
    public function __construct(
        private readonly SettingsService $settings
    ) {}

    public function processScan(string $idNumber, ?array $cachedUser = null): array
    {
        if ($cachedUser) {
            $userId      = $cachedUser['id'];
            $userName    = $cachedUser['name'];
            $role        = $cachedUser['role'];
            $teacherId   = $cachedUser['teacher_id'] ?? null;
            $parentPhone = $cachedUser['parent_phone'] ?? null;
            $photoUrl    = $cachedUser['photo_url'] ?? null;
        } else {
            $user = User::with(['roles', 'studentProfile'])->where('id_number', $idNumber)->first();

            if (!$user) {
                return ['error' => 'User not found', 'code' => 404];
            }

            $userId      = $user->id;
            $userName    = $user->name;
            $role        = $user->getRoleNames()->first();
            $teacherId   = ($role === 'student' && $user->studentProfile) ? $user->studentProfile->teacher_id : null;
            $parentPhone = ($role === 'student' && $user->studentProfile) ? $user->studentProfile->parent_phone : null;
            $photoUrl    = $user->photo_url;
        }

        $date = now()->toDateString();
        $time = now()->toTimeString();
        $timeStr = now()->format('H:i');

        $systemSettings = $this->settings->all();
        $startTime = $systemSettings['school_start_time'] ?? '08:00';
        $pmTimeOutStr = $systemSettings['school_end_time'] ?? '16:00';

        $attendance = Attendance::forDate($date)->forUser($userId)->first();

        $type = 'Time In';
        $status = 'present';
        $logType = 'in';

        if ($attendance) {
            if ($timeStr >= $pmTimeOutStr) {
                if (!$attendance->time_out) {
                    $attendance->time_out = $time;
                    $attendance->pm_status = 'present';
                    $attendance->save();
                    $type = 'Time Out';
                    $logType = 'out';
                    $status = 'present';
                } else {
                    $type = 'Time Out (Re-entry)';
                    $logType = 'out';
                    $status = $attendance->pm_status ?? 'present';
                }
            } else {
                $lastLog = AttendanceLog::where('user_id', $userId)
                    ->whereDate('scanned_at', now()->toDateString())
                    ->orderBy('scanned_at', 'desc')
                    ->first();

                $logType = ($lastLog && $lastLog->type === 'in') ? 'out' : 'in';
                $type = $logType === 'in' ? 'Time In (Log)' : 'Time Out (Log)';
                $status = 'present';
            }
        } else {
            $logType = 'in';
            $type = 'Time In';

            if ($timeStr < '12:00') {
                $amStatus = ($timeStr < $startTime) ? 'present' : 'late';
                Attendance::create([
                    'user_id' => $userId,
                    'date'    => $date,
                    'time_in' => $time,
                    'am_status' => $amStatus,
                    'status'  => $amStatus,
                ]);
                $status = $amStatus;
            } else {
                Attendance::create([
                    'user_id' => $userId,
                    'date'    => $date,
                    'time_in' => $time,
                    'am_status' => 'absent',
                    'pm_status' => 'present',
                    'status'  => 'late',
                ]);
                $status = 'late';
            }
        }

        AttendanceLog::create([
            'user_id' => $userId,
            'type' => $logType,
            'scanned_at' => now(),
        ]);

        $isTimeIn = str_starts_with($type, 'Time In');
        $eventNotificationsEnabled = $isTimeIn
            ? (bool) ($systemSettings['notify_check_in'] ?? true)
            : (bool) ($systemSettings['notify_check_out'] ?? true);
        $lateNotificationsEnabled = $status !== 'late' || (bool) ($systemSettings['notify_late'] ?? true);

        if ($role === 'student' && $teacherId
            && $eventNotificationsEnabled
            && $lateNotificationsEnabled
            && (bool) ($systemSettings['enable_push_notifications'] ?? true)) {
            $teacher = User::find($teacherId);
            if ($teacher) {
                $teacher->notify(new StudentScannedNotification(
                    $userName,
                    $type,
                    now()->format('h:i A'),
                    $status
                ));
            }
        }

        event(new \App\Events\AttendanceLogged([
            'user_name' => $userName,
            'type' => $type,
            'status' => $status,
            'time' => now()->format('h:i A'),
        ]));

        if ($role === 'student' && !empty($parentPhone)
            && $eventNotificationsEnabled
            && $lateNotificationsEnabled
            && (bool) ($systemSettings['enable_sms_notifications'] ?? false)) {
            // TEMPORARY: Cooldown disabled for testing
            // $cooldownKey = "sms_cooldown_{$userId}";
            // if (\Illuminate\Support\Facades\Cache::add($cooldownKey, true, now()->addMinutes(15))) {
                $timeStrFormatted = now()->format('h:i A');
                
                $message = str_starts_with($type, 'Time In')
                    ? "Good day! Your child {$userName} has entered the school premises at {$timeStrFormatted}."
                    : "Good day! Your child {$userName} has left the school premises at {$timeStrFormatted}.";
                    
                \App\Jobs\SendParentSmsNotification::dispatch($parentPhone, $message);
            // }
        }

        return [
            'success' => true,
            'user_id'  => $userId,
            'name'     => $userName,
            'photo_url' => $photoUrl,
            'type'     => $type,
            'status'   => $status,
            'role'     => $role,
        ];
    }

    public function getTodayStats(?string $date = null): array
    {
        $date = $date ?: now()->toDateString();

        $statusCounts = Attendance::forDate($date)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $present = (int) $statusCounts->get('present', 0);
        $late = (int) $statusCounts->get('late', 0);

        $totalUsers = User::whereHas('roles', fn($q) => $q->whereIn('name', ['student', 'teacher']))->count();
        $totalPresent = $present + $late;
        $absent = max(0, $totalUsers - $totalPresent);

        $roleCounts = \DB::table('attendances')
            ->join('model_has_roles', 'attendances.user_id', '=', 'model_has_roles.model_id')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('attendances.date', $date)
            ->where('model_has_roles.model_type', User::class)
            ->select('roles.name', \DB::raw('COUNT(DISTINCT attendances.user_id) as count'))
            ->groupBy('roles.name')
            ->pluck('count', 'name');

        $startDate = now()->subDays(6)->toDateString();
        $trend = Attendance::where('date', '>=', $startDate)
            ->withStatus(['present', 'late'])
            ->selectRaw('date, COUNT(*) as value')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($row) => [
                'name' => \Carbon\Carbon::parse($row->date)->format('D'),
                'value' => (int) $row->value,
            ]);

        return [
            'overview' => [
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
            ],
            'distribution' => [
                'students' => (int) $roleCounts->get('student', 0),
                'teachers' => (int) $roleCounts->get('teacher', 0),
            ],
            'trend' => $trend,
            'total_users' => $totalUsers,
        ];
    }
}
