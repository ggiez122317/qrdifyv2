<?php

namespace App\Services;

use App\Events\AttendanceLogged;
use App\Jobs\SendSmsDelivery;
use App\Models\Attendance;
use App\Models\AttendanceLog;
use App\Models\SmsDelivery;
use App\Models\User;
use App\Notifications\StudentScannedNotification;
use App\Services\Sms\PhoneNumberNormalizer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AttendanceService
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly PhoneNumberNormalizer $phoneNumbers,
    ) {}

    public function processScan(
        string $idNumber,
        ?array $cachedUser = null,
        ?string $idempotencyKey = null,
        ?string $scanSource = null,
    ): array {
        if ($cachedUser) {
            $userId = $cachedUser['id'];
            $userName = $cachedUser['name'];
            $role = $cachedUser['role'];
            $teacherId = $cachedUser['teacher_id'] ?? null;
            $parentPhone = $cachedUser['parent_phone'] ?? null;
            $photoUrl = $cachedUser['photo_url'] ?? null;
        } else {
            $user = User::with(['roles', 'studentProfile'])->where('id_number', $idNumber)->first();

            if (! $user) {
                return ['error' => 'User not found', 'code' => 404];
            }

            $userId = $user->id;
            $userName = $user->name;
            $role = $user->getRoleNames()->first();
            $teacherId = ($role === 'student' && $user->studentProfile) ? $user->studentProfile->teacher_id : null;
            $parentPhone = ($role === 'student' && $user->studentProfile) ? $user->studentProfile->parent_phone : null;
            $photoUrl = $user->photo_url;
        }

        $scannedAt = now();
        $startTime = (string) $this->settings->get('school_start_time', '08:00');
        $schoolEndTime = (string) $this->settings->get('school_end_time', '16:00');
        $deduplicationSeconds = max(
            0,
            (int) $this->settings->get('scan_deduplication_seconds', 10),
        );
        $smsEnabled = (bool) $this->settings->get('enable_sms_notifications', false);
        $recipient = $this->phoneNumbers->normalizePhilippineMobile($parentPhone);
        $storedIdempotencyKey = $idempotencyKey
            ? hash('sha256', $userId.'|'.trim($idempotencyKey))
            : null;

        $scanResult = DB::transaction(function () use (
            $userId,
            $userName,
            $role,
            $scannedAt,
            $startTime,
            $schoolEndTime,
            $deduplicationSeconds,
            $smsEnabled,
            $recipient,
            $storedIdempotencyKey,
            $scanSource,
        ): array {
            if (User::whereKey($userId)->lockForUpdate()->first(['id']) === null) {
                return ['error' => 'User not found', 'code' => 404];
            }

            if ($storedIdempotencyKey !== null) {
                $idempotentLog = AttendanceLog::where('idempotency_key', $storedIdempotencyKey)->first();

                if ($idempotentLog !== null) {
                    return $this->duplicateScanResult($idempotentLog);
                }
            }

            $lastLog = AttendanceLog::where('user_id', $userId)
                ->latest('scanned_at')
                ->first();

            if (
                $deduplicationSeconds > 0
                && $lastLog !== null
                && $lastLog->scanned_at->diffInSeconds($scannedAt) <= $deduplicationSeconds
            ) {
                return $this->duplicateScanResult($lastLog);
            }

            $date = $scannedAt->toDateString();
            $time = $scannedAt->toTimeString();
            $timeString = $scannedAt->format('H:i');
            $attendance = Attendance::forDate($date)
                ->forUser($userId)
                ->lockForUpdate()
                ->first();

            $type = 'Time In';
            $status = 'present';
            $logType = 'in';

            if ($attendance) {
                if ($timeString >= $schoolEndTime) {
                    if (! $attendance->time_out) {
                        $attendance->forceFill([
                            'time_out' => $time,
                            'pm_status' => 'present',
                        ])->save();
                        $type = 'Time Out';
                        $logType = 'out';
                    } else {
                        $type = 'Time Out (Re-entry)';
                        $logType = 'out';
                        $status = $attendance->pm_status ?? 'present';
                    }
                } else {
                    $logType = ($lastLog && $lastLog->type === 'in') ? 'out' : 'in';
                    $type = $logType === 'in' ? 'Time In (Log)' : 'Time Out (Log)';
                }
            } else {
                if ($timeString < '12:00') {
                    $amStatus = ($timeString < $startTime) ? 'present' : 'late';
                    Attendance::create([
                        'user_id' => $userId,
                        'date' => $date,
                        'time_in' => $time,
                        'am_status' => $amStatus,
                        'status' => $amStatus,
                    ]);
                    $status = $amStatus;
                } else {
                    Attendance::create([
                        'user_id' => $userId,
                        'date' => $date,
                        'time_in' => $time,
                        'am_status' => 'absent',
                        'pm_status' => 'present',
                        'status' => 'late',
                    ]);
                    $status = 'late';
                }
            }

            $attendanceLog = AttendanceLog::create([
                'user_id' => $userId,
                'type' => $logType,
                'status' => $status,
                'scanned_at' => $scannedAt,
                'idempotency_key' => $storedIdempotencyKey,
                'scan_source' => $scanSource ? trim($scanSource) : null,
            ]);

            $delivery = null;

            if ($role === 'student' && $smsEnabled && $recipient !== null) {
                $eventText = $logType === 'in' ? 'entered' : 'left';
                $schoolName = (string) config('sms.school_name', 'School');
                $message = "[{$schoolName}] Your child {$userName} {$eventText} the school at {$scannedAt->format('h:i A')}.";
                $deduplicationKey = hash(
                    'sha256',
                    $attendanceLog->id.'|'.$recipient.'|'.$logType,
                );

                $delivery = SmsDelivery::create([
                    'user_id' => $userId,
                    'attendance_log_id' => $attendanceLog->id,
                    'deduplication_key' => $deduplicationKey,
                    'recipient' => $recipient,
                    'event_type' => $logType,
                    'message' => $message,
                    'provider' => (string) config('sms.provider', 'huawei_router'),
                    'status' => 'queued',
                ]);
            }

            return [
                'success' => true,
                'duplicate' => false,
                'type' => $type,
                'status' => $status,
                'log_type' => $logType,
                'delivery_id' => $delivery?->id,
            ];
        }, 3);

        if (isset($scanResult['error'])) {
            return $scanResult;
        }

        $result = array_merge($scanResult, [
            'user_id' => $userId,
            'name' => $userName,
            'photo_url' => $photoUrl,
            'role' => $role,
        ]);

        if ($result['duplicate']) {
            return $result;
        }

        if ($role === 'student' && $teacherId) {
            $teacher = User::find($teacherId);
            $teacher?->notify(new StudentScannedNotification(
                $userName,
                $result['type'],
                $scannedAt->format('h:i A'),
                $result['status'],
            ));
        }

        event(new AttendanceLogged([
            'user_name' => $userName,
            'type' => $result['type'],
            'status' => $result['status'],
            'time' => $scannedAt->format('h:i A'),
        ]));

        if ($result['delivery_id'] !== null) {
            SendSmsDelivery::dispatch($result['delivery_id'])->afterCommit();
        }

        return $result;
    }

    private function duplicateScanResult(AttendanceLog $log): array
    {
        return [
            'success' => true,
            'duplicate' => true,
            'type' => $log->type === 'in' ? 'Time In' : 'Time Out',
            'status' => $log->status ?? 'present',
            'log_type' => $log->type,
            'delivery_id' => null,
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

        $totalUsers = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['student', 'teacher']))->count();
        $totalPresent = $present + $late;
        $absent = max(0, $totalUsers - $totalPresent);

        $roleCounts = DB::table('attendances')
            ->join('model_has_roles', 'attendances.user_id', '=', 'model_has_roles.model_id')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('attendances.date', $date)
            ->where('model_has_roles.model_type', User::class)
            ->select('roles.name', DB::raw('COUNT(DISTINCT attendances.user_id) as count'))
            ->groupBy('roles.name')
            ->pluck('count', 'name');

        $startDate = now()->subDays(6)->toDateString();
        $trend = Attendance::where('date', '>=', $startDate)
            ->withStatus(['present', 'late'])
            ->selectRaw('date, COUNT(*) as value')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'name' => Carbon::parse($row->date)->format('D'),
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
