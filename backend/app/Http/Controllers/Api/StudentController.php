<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\AttendanceResource;
use App\Models\Attendance;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Schedule;
use App\Models\ExcuseLetter;
use App\Notifications\AlarmNotification;
use App\Notifications\ExcuseLetterNotification;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class StudentController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    /**
     * Get statistics for the Student Management dashboard.
     */
    public function stats(): JsonResponse
    {
        return response()->json($this->dashboardService->getStudentStats());
    }

    /**
     * List all students with pagination and optional search.
     *
     * Supports: ?search=... &per_page=50
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        $query = User::students()
            ->with('studentProfile:id,user_id,grade,section,parent_name,parent_phone,teacher_id')
            ->select('id', 'name', 'email', 'id_number', 'photo_url');

        // Search filter
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('id_number', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $students = $query->orderBy('name')->paginate($perPage);

        // Transform paginated results while preserving pagination metadata
        $students->getCollection()->transform(function ($user) {
            return [
                'id'              => $user->id,
                'name'            => $user->name,
                'lrn'             => $user->id_number,
                'email'           => $user->email,
                'status'          => 'enrolled',
                'photo_url'       => $user->photo_url,
                'student_profile' => $user->student_profile,
            ];
        });

        return response()->json($students);
    }

    /**
     * Create a new student.
     */
    public function store(StoreStudentRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'student');

            $lrn = $request->lrn ?: 'LRN-' . mt_rand(10000000, 99999999);

            $user = User::create([
                'name'      => trim($request->first_name . ' ' . $request->last_name),
                'email'     => $request->email,
                'id_number' => $lrn,
                'password'  => Hash::make('password123'),
                'photo_url' => $photoUrl,
            ]);

            $user->assignRole('student');

            StudentProfile::create([
                'user_id'      => $user->id,
                'grade'        => $request->grade_level,
                'section'      => $request->section,
                'parent_name'  => $request->parent_name,
                'parent_phone' => $request->parent_phone,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Student created successfully',
                'student' => $user->load('student_profile'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error('Error creating student', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error creating student. Please try again.'], 500);
        }
    }

    /**
     * Show a single student.
     */
    public function show($id): JsonResponse
    {
        try {
            $student = User::students()
                ->with('studentProfile')
                ->findOrFail($id);

            return response()->json([
                'id'              => $student->id,
                'name'            => $student->name,
                'lrn'             => $student->id_number,
                'email'           => $student->email,
                'status'          => 'enrolled',
                'photo_url'       => $student->photo_url,
                'student_profile' => $student->studentProfile,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Student not found.'], 404);
        } catch (\Throwable $e) {
            logger()->error('Error fetching student', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Error fetching student.'], 500);
        }
    }

    /**
     * Update a student.
     */
    public function update(UpdateStudentRequest $request, $id): JsonResponse
    {
        $user = User::students()->findOrFail($id);

        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'student');
            if ($photoUrl) {
                $user->photo_url = $photoUrl;
            }

            $lrn = $request->lrn ?: ($user->id_number ?: 'LRN-' . mt_rand(10000000, 99999999));

            $user->update([
                'name'      => trim($request->first_name . ' ' . $request->last_name),
                'email'     => $request->email,
                'id_number' => $lrn,
            ]);

            if ($user->student_profile) {
                $user->student_profile->update([
                    'grade'        => $request->grade_level,
                    'section'      => $request->section,
                    'parent_name'  => $request->parent_name,
                    'parent_phone' => $request->parent_phone,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Student updated successfully',
                'student' => $user->load('student_profile'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error('Error updating student', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error updating student. Please try again.'], 500);
        }
    }

    /**
     * Student dashboard — for the logged-in student.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $attendances = Attendance::forUser($user->id)
            ->whereMonth('date', now()->month)
            ->orderByDesc('date')
            ->get();

        $totalPresent = $attendances->count();
        $todayAttendance = $attendances->firstWhere('date', now()->toDateString());

        $status = 'Pending';
        if ($todayAttendance) {
            $status = ucfirst($todayAttendance->status);
        }

        $history = $attendances->map(fn($att) => [
            'id'       => $att->id,
            'date'     => $att->date,
            'time_in'  => $att->time_in,
            'time_out' => $att->time_out,
            'status'   => ucfirst($att->status),
        ]);

        return response()->json([
            'total_present' => $totalPresent,
            'total_absent'  => 0,
            'today_status'  => $status,
            'history'       => $history,
        ]);
    }

    /**
     * Handle base64 photo upload.
     * Extracted to reduce duplication between store() and update().
     */
    private function handlePhotoUpload(Request $request, string $prefix): ?string
    {
        if (!$request->filled('photo_base64')) {
            return null;
        }

        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->photo_base64));
        $filename = "{$prefix}_" . time() . '_' . uniqid() . '.jpg';
        Storage::disk('public')->put('photos/' . $filename, $imageData);

        return '/storage/photos/' . $filename;
    }

    /**
     * Detailed attendance record for charts and analysis.
     * Uses SQL aggregates instead of loading all records into PHP memory.
     */
    public function attendanceRecord(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // 1. Overall Distribution — single aggregate query
        $summary = Attendance::forUser($user->id)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
            ")
            ->first();

        $total = (int) $summary->total;
        $present = (int) $summary->present;
        $absent = (int) $summary->absent;
        $late = (int) $summary->late;

        $distribution = [
            ['name' => 'Present', 'value' => $present, 'color' => '#10b981'],
            ['name' => 'Absent', 'value' => $absent, 'color' => '#ef4444'],
            ['name' => 'Late', 'value' => $late, 'color' => '#f59e0b'],
        ];

        // 2. Monthly Trend — single aggregate query grouped by month
        $monthlyTrend = Attendance::forUser($user->id)
            ->selectRaw("
                DATE_FORMAT(date, '%Y-%m') as month,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
            ")
            ->groupByRaw("DATE_FORMAT(date, '%Y-%m')")
            ->orderByRaw("DATE_FORMAT(date, '%Y-%m')")
            ->get()
            ->map(fn($row) => [
                'month' => \Carbon\Carbon::parse($row->month . '-01')->format('M Y'),
                'present' => (int) $row->present,
                'absent' => (int) $row->absent,
                'late' => (int) $row->late,
            ]);

        // 3. Paginated history (only load what's needed, not all records)
        $perPage = min((int) $request->get('per_page', 50), 100);
        $history = Attendance::forUser($user->id)
            ->orderByDesc('date')
            ->paginate($perPage);

        $history->getCollection()->transform(fn($att) => [
            'id'       => $att->id,
            'date'     => $att->date,
            'time_in'  => $att->time_in,
            'time_out' => $att->time_out,
            'status'   => ucfirst($att->status),
            'remarks'  => $att->remarks,
        ]);

        return response()->json([
            'summary' => [
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'present_percentage' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
            ],
            'distribution' => $distribution,
            'monthly_trend' => $monthlyTrend,
            'history' => $history,
        ]);
    }

    /**
     * Get class schedules and personal alarms
     */
    public function getSchedules(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $schedules = Schedule::where('user_id', $user->id)->get();

        return response()->json($schedules);
    }

    /**
     * Add a personal schedule / alarm
     */
    public function addSchedule(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'start_time' => 'required',
            'is_alarm' => 'boolean',
        ]);

        $schedule = Schedule::create([
            'user_id' => $user->id,
            'type' => 'personal',
            'title' => $request->title,
            'description' => $request->description,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'is_alarm' => $request->is_alarm ?? false,
        ]);

        return response()->json(['message' => 'Schedule added', 'schedule' => $schedule], 201);
    }

    /**
     * Update an existing schedule
     */
    public function updateSchedule(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $schedule = Schedule::where('user_id', $user->id)->findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'start_time' => 'required',
            'is_alarm' => 'boolean',
        ]);

        $schedule->update([
            'title' => $request->title,
            'description' => $request->description,
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'is_alarm' => $request->is_alarm ?? false,
        ]);

        return response()->json(['message' => 'Schedule updated', 'schedule' => $schedule]);
    }

    /**
     * Delete a schedule
     */
    public function deleteSchedule($id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $schedule = Schedule::where('user_id', $user->id)->findOrFail($id);
        $schedule->delete();

        return response()->json(['message' => 'Schedule deleted']);
    }

    /**
     * Trigger alarm notification to log it in database
     */
    public function triggerAlarmNotification(Request $request, $id): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $schedule = Schedule::where('user_id', $user->id)->findOrFail($id);

        // Notify user via database channel
        $user->notify(new AlarmNotification(
            "Alarm: {$schedule->title}", 
            $schedule->description ?? "It's time for your scheduled task!"
        ));

        return response()->json(['message' => 'Notification triggered']);
    }

    /**
     * Get excuse letters for the student
     */
    public function getExcuseLetters(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $letters = ExcuseLetter::where('student_id', $user->id)
            ->with('teacher:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($letters);
    }

    public function getTeachers(Request $request): JsonResponse
    {
        $teachers = User::role('teacher')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($teachers);
    }

    /**
     * Submit a new excuse letter
     */
    public function submitExcuseLetter(Request $request): JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'absent_date' => 'required|date',
            'reason' => 'required|string',
            'teacher_id' => 'required|exists:users,id',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        $teacherId = $request->teacher_id;

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('excuses', 'public');
        }

        $excuseLetter = ExcuseLetter::create([
            'student_id' => $user->id,
            'teacher_id' => $teacherId,
            'title' => $request->title,
            'absent_date' => $request->absent_date,
            'reason' => $request->reason,
            'status' => 'pending',
            'attachment_path' => $path,
        ]);

        // Notify the teacher
        $teacher = User::find($teacherId);
        if ($teacher) {
            try {
                $teacher->notify(new ExcuseLetterNotification(
                    "New Excuse Letter from {$user->name}",
                    "{$user->name} has submitted an excuse letter for {$request->absent_date}. Reason: {$request->reason}. Please review and make a decision.",
                    "excuse_letter_submitted"
                ));
            } catch (\Throwable $e) {
                logger('Failed to notify teacher about excuse letter submission: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Your excuse letter has been sent to your teacher. Please wait for their confirmation.', 'letter' => $excuseLetter]);
    }

    /**
     * Delete an excuse letter
     */
    public function deleteExcuseLetter(Request $request, $id): \Illuminate\Http\JsonResponse
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $letter = ExcuseLetter::where('student_id', $user->id)->findOrFail($id);
        
        // Clean up the excused attendance record if the letter was approved
        if ($letter->status === 'approved') {
            Attendance::where('user_id', $letter->student_id)
                ->where('date', $letter->absent_date)
                ->where('status', 'excused')
                ->delete();
        }

        // Delete attachment if exists
        if ($letter->attachment_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($letter->attachment_path);
        }

        $letter->delete();

        return response()->json(['message' => 'Your excuse letter has been removed successfully.']);
    }
}
