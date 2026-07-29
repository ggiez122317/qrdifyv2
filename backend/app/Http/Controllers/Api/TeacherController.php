<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use App\Models\Attendance;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Models\ExcuseLetter;
use App\Models\TeacherLeave;
use App\Notifications\ExcuseLetterNotification;
use App\Notifications\TeacherLeaveNotification;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class TeacherController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    public function stats(): JsonResponse
    {
        return response()->json($this->dashboardService->getTeacherStats());
    }

    /**
     * List all teachers with pagination and optional search.
     *
     * Supports: ?search=... &per_page=50
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        $query = User::teachers()
            ->with('teacherProfile:id,user_id,position,contact_number')
            ->select('id', 'name', 'email', 'id_number', 'photo_url');

        // Search filter
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('id_number', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('name')->paginate($perPage);

        // Transform paginated results
        $teachers->getCollection()->transform(function ($user) {
            return [
                'id'              => $user->id,
                'name'            => $user->name,
                'employee_id'     => $user->id_number,
                'email'           => $user->email,
                'status'          => 'active',
                'photo_url'       => $user->photo_url,
                'teacher_profile' => $user->teacher_profile,
            ];
        });

        return response()->json($teachers);
    }

    /**
     * Create a new teacher.
     */
    public function store(StoreTeacherRequest $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'teacher');

            $employeeId = $request->employee_id ?: 'TCH-' . mt_rand(100000, 999999);

            $user = User::create([
                'name'      => trim($request->first_name . ' ' . $request->last_name),
                'email'     => $request->email,
                'id_number' => $employeeId,
                'password'  => Hash::make('password123'),
                'photo_url' => $photoUrl,
            ]);

            $user->assignRole('teacher');

            TeacherProfile::create([
                'user_id'        => $user->id,
                'position'       => $request->position,
                'contact_number' => $request->phone,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Teacher created successfully',
                'teacher' => $user->load('teacherProfile'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error('Error creating teacher', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error creating teacher. Please try again.'], 500);
        }
    }

    /**
     * Show a single teacher.
     */
    public function show(string $id): JsonResponse
    {
        $teacher = User::teachers()
            ->with('teacherProfile')
            ->findOrFail($id);

        return response()->json([
            'id'              => $teacher->id,
            'name'            => $teacher->name,
            'employee_id'     => $teacher->id_number,
            'email'           => $teacher->email,
            'status'          => 'active',
            'photo_url'       => $teacher->photo_url,
            'teacher_profile' => $teacher->teacher_profile,
        ]);
    }

    /**
     * Update a teacher.
     */
    public function update(UpdateTeacherRequest $request, string $id): JsonResponse
    {
        $user = User::teachers()->findOrFail($id);

        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'teacher');
            if ($photoUrl) {
                $user->photo_url = $photoUrl;
            }

            $employeeId = $request->employee_id ?: ($user->id_number ?: 'TCH-' . mt_rand(100000, 999999));

            $user->update([
                'name'      => trim($request->first_name . ' ' . $request->last_name),
                'email'     => $request->email,
                'id_number' => $employeeId,
            ]);

            if ($user->teacher_profile) {
                $user->teacher_profile->update([
                    'position'       => $request->position,
                    'contact_number' => $request->phone,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Teacher updated successfully',
                'teacher' => $user->load('teacherProfile'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            logger()->error('Error updating teacher', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Error updating teacher. Please try again.'], 500);
        }
    }

    /**
     * Teacher dashboard.
     * Uses aggregate COUNT queries instead of fetching all attendance.
     */
    public function dashboard(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        if (!$user || !$user->hasRole('teacher')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $today = now()->toDateString();
        $studentIds = \App\Models\StudentProfile::where('teacher_id', $user->id)->pluck('user_id');

        // Single aggregate query for today's status breakdown
        $todayStatusRow = Attendance::whereIn('user_id', $studentIds)
            ->forDate($today)
            ->selectRaw("
                SUM(CASE WHEN status IN ('present','early') THEN 1 ELSE 0 END) as total_present,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as total_late,
                COUNT(*) as total_scanned
            ")
            ->first();

        $totalPresent = (int) ($todayStatusRow->total_present ?? 0);
        $totalLate = (int) ($todayStatusRow->total_late ?? 0);
        $scannedIds = Attendance::whereIn('user_id', $studentIds)
            ->where('date', $today)
            ->pluck('user_id');
        $totalAbsent = $studentIds->count() - $scannedIds->count();

        // Excused: Approved excuse letters for today
        $totalExcused = ExcuseLetter::where('teacher_id', $user->id)
            ->where('absent_date', $today)
            ->where('status', 'approved')
            ->count();

        // 7-Day Chart Data -- single aggregate query instead of 14 separate queries
        $startDate = now()->subDays(6)->toDateString();
        $endDate = now()->toDateString();
        $aggregate = Attendance::whereIn('user_id', $studentIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->selectRaw('date, status, COUNT(*) as count')
            ->groupBy('date', 'status')
            ->get()
            ->groupBy('date');

        $totalAssigned = $studentIds->count();
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $label = now()->subDays($i)->format('M d');
            $dayStats = $aggregate->get($date, collect());

            $present = $dayStats->whereIn('status', ['present', 'early'])->sum('count');
            $late = $dayStats->where('status', 'late')->sum('count');
            $presentIds = $dayStats->sum('count');
            $absent = $totalAssigned - $presentIds;

            $chartData[] = [
                'name' => $label,
                'present' => $present,
                'late' => $late,
                'absent' => max(0, $absent),
            ];
        }

        // Today's Schedule
        $dayOfWeek = now()->dayOfWeek;
        $schedule = \App\Models\Schedule::where('user_id', $user->id)
            ->where('type', 'class')
            ->where('day_of_week', $dayOfWeek)
            ->orderBy('start_time')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'title' => $s->title,
                    'time' => \Carbon\Carbon::parse($s->start_time)->format('h:i A') . ' - ' . \Carbon\Carbon::parse($s->end_time)->format('h:i A'),
                ];
            });

        // Recent Excuse Letters
        $recentExcuses = ExcuseLetter::where('teacher_id', $user->id)
            ->where('status', 'pending')
            ->with(['student:id,name,photo_url'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'student_name' => $e->student->name,
                    'photo_url' => $e->student->photo_url,
                    'title' => $e->title,
                    'date' => \Carbon\Carbon::parse($e->absent_date)->format('M d, Y'),
                ];
            });

        // Fetch recent scans
        $recentScans = Attendance::whereIn('user_id', $studentIds)
            ->with('user:id,name,photo_url')
            ->forDate($today)
            ->orderByDesc('time_in')
            ->take(10)
            ->get()
            ->map(function ($att) {
                return [
                    'id'   => $att->id,
                    'user' => [
                        'name'      => $att->user->name,
                        'role'      => 'student',
                        'photo_url' => $att->user->photo_url,
                    ],
                    'type'   => 'Time In',
                    'status' => ucfirst($att->status),
                    'time'   => $att->time_in,
                ];
            });

        return response()->json([
            'overview' => [
                'total_present' => $totalPresent,
                'total_late'    => $totalLate,
                'total_absent'  => $totalAbsent,
                'total_excused' => $totalExcused,
            ],
            'chart_data' => $chartData,
            'schedule' => $schedule,
            'recent_excuses' => $recentExcuses,
            'recent_scans' => $recentScans,
        ]);
    }

    /**
     * Handle base64 photo upload.
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
     * Get unique classes assigned to the teacher based on student profiles.
     */
    public function assignedClasses(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $today = now()->toDateString();
        
        $classes = \App\Models\StudentProfile::where('teacher_id', $user->id)
            ->select('grade', 'section')
            ->distinct()
            ->orderBy('grade')
            ->orderBy('section')
            ->get();
            
        $totalStudents = \App\Models\StudentProfile::where('teacher_id', $user->id)->count();
        $studentIds = \App\Models\StudentProfile::where('teacher_id', $user->id)->pluck('user_id');
        
        $totalPresent = \App\Models\Attendance::whereIn('user_id', $studentIds)
            ->forDate($today)->whereIn('status', ['present', 'early'])->count();
            
        $presentIds = \App\Models\Attendance::whereIn('user_id', $studentIds)
            ->where('date', $today)
            ->pluck('user_id');
            
        $totalAbsent = $totalStudents - $presentIds->count();
            
        // Fetch attendance counts per class in a single query
        $classAttendance = \Illuminate\Support\Facades\DB::table('users')
            ->join('student_profiles', 'users.id', '=', 'student_profiles.user_id')
            ->leftJoin('attendances', function ($join) use ($today) {
                $join->on('users.id', '=', 'attendances.user_id')
                     ->where('attendances.date', '=', $today);
            })
            ->where('student_profiles.teacher_id', $user->id)
            ->selectRaw("
                student_profiles.grade,
                student_profiles.section,
                COUNT(DISTINCT users.id) as total_students,
                COUNT(DISTINCT CASE WHEN attendances.status IN ('present','early') THEN users.id END) as present_count,
                COUNT(DISTINCT CASE WHEN attendances.status = 'late' THEN users.id END) as late_count
            ")
            ->groupBy('student_profiles.grade', 'student_profiles.section')
            ->get()
            ->keyBy(fn($row) => $row->grade . '|' . $row->section);

        // Pre-fetch today's schedule ONCE instead of inside the loop (was N+1)
        $todaySchedules = \App\Models\Schedule::where('user_id', $user->id)
            ->where('type', 'class')
            ->where('day_of_week', now()->dayOfWeek)
            ->get();

        $classes->transform(function ($c) use ($user, $today, $classAttendance, $todaySchedules) {
            $key = $c->grade . '|' . $c->section;
            $stats = $classAttendance->get($key);

            $totalInClass = $stats->total_students ?? 0;
            $presentInClass = $stats->present_count ?? 0;
            $lateInClass = $stats->late_count ?? 0;
            $absentInClass = $totalInClass - ($presentInClass + $lateInClass);

            $scheduleInfo = $todaySchedules->first();

            $startTime = $scheduleInfo?->start_time ? \Carbon\Carbon::parse($scheduleInfo->start_time)->format('g:i A') : null;
            $endTime = $scheduleInfo?->end_time ? \Carbon\Carbon::parse($scheduleInfo->end_time)->format('g:i A') : null;
            $timeRange = $startTime && $endTime ? "{$startTime} - {$endTime}" : null;

            return [
                'grade' => $c->grade,
                'section' => $c->section,
                'subject' => $user->teacher_profile->subject ?? 'General Advisory',
                'schedule' => $scheduleInfo?->title ?? null,
                'time' => $timeRange,
                'room' => $scheduleInfo?->description ?? null,
                'total_students' => $totalInClass,
                'attendance' => [
                    'present' => $presentInClass,
                    'late' => $lateInClass,
                    'absent' => max(0, $absentInClass),
                ]
            ];
        });

        return response()->json([
            'overview' => [
                'assigned_classes' => $classes->count(),
                'total_students' => $totalStudents,
                'present_today' => $totalPresent,
                'absent_today' => $totalAbsent
            ],
            'classes' => $classes
        ]);
    }
    
    /**
     * Get attendance breakdown for a specific class assigned to this teacher.
     */
    public function classAttendance(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $grade = $request->get('grade');
        $section = $request->get('section');
        $date = $request->get('date', now()->toDateString());

        // Get students in this specific class
        $students = \App\Models\User::whereHas('studentProfile', function($q) use ($user, $grade, $section) {
            $q->where('teacher_id', $user->id)
              ->where('grade', $grade)
              ->where('section', $section);
        })->get();

        // Get attendance for these students today
        $attendances = Attendance::whereIn('user_id', $students->pluck('id'))
            ->where('date', $date)
            ->get()
            ->keyBy('user_id');

        $result = $students->map(function ($s) use ($attendances) {
            $att = $attendances->get($s->id);
            return [
                'id' => $s->id,
                'name' => $s->name,
                'photo_url' => $s->photo_url,
                'status' => $att ? $att->status : 'absent', // If no scan, they are absent
                'time_in' => $att ? $att->time_in : null,
            ];
        });

        return response()->json([
            'present' => $result->whereIn('status', ['present', 'early'])->values(),
            'late' => $result->where('status', 'late')->values(),
            'absent' => $result->where('status', 'absent')->values(),
        ]);
    }

    /**
     * List all students assigned to the teacher with PDS and attendance overview.
     */
    public function assignedStudents(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $perPage = min((int) $request->get('per_page', 50), 100);
        
        $query = \App\Models\User::whereHas('studentProfile', function($q) use ($user, $request) {
            $q->where('teacher_id', $user->id);
            
            if ($grade = $request->get('grade')) {
                $q->where('grade', $grade);
            }
            if ($section = $request->get('section')) {
                $q->where('section', $section);
            }
        })
        ->with(['studentProfile'])
        ->withCount(['attendances as total_absences' => function($q) {
            // Simplified count for demonstration. In reality, you'd calculate days without attendance.
            $q->where('status', 'absent'); 
        }]);

        if ($search = $request->get('search')) {
            $query->where('name', 'LIKE', "%{$search}%");
        }

        $students = $query->orderBy('name')->paginate($perPage);
        return response()->json($students);
    }

    /**
     * List only absent students for the teacher today.
     */
    public function absentStudents(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $date = now()->toDateString();
        $perPage = min((int) $request->get('per_page', 50), 100);

        // All students for this teacher
        $studentIds = \App\Models\StudentProfile::where('teacher_id', $user->id)->pluck('user_id');

        // Students who HAVE scanned today
        $presentIds = Attendance::whereIn('user_id', $studentIds)
            ->where('date', $date)
            ->pluck('user_id');

        // Students with an approved excuse letter covering today
        $excusedIds = \App\Models\ExcuseLetter::whereIn('student_id', $studentIds)
            ->where('status', 'approved')
            ->where('absent_date', $date)
            ->pluck('student_id');

        // Absent students are those assigned to teacher but NOT in the present or excused list
        $query = \App\Models\User::whereIn('id', $studentIds)
            ->whereNotIn('id', $presentIds)
            ->whereNotIn('id', $excusedIds)
            ->with(['studentProfile']);

        if ($grade = $request->get('grade')) {
            $query->whereHas('studentProfile', fn($q) => $q->where('grade', $grade));
        }
        if ($section = $request->get('section')) {
            $query->whereHas('studentProfile', fn($q) => $q->where('section', $section));
        }

        $absent = $query->orderBy('name')->paginate($perPage);
        return response()->json($absent);
    }
    
    /**
     * Send Push Notification/Notice to student.
     */
    public function sendNotice(Request $request): JsonResponse
    {
        $request->validate([
            'student_id' => 'required|exists:users,id',
            'title' => 'required|string',
            'message' => 'required|string',
        ]);
        
        // Find a principal to associate with this notice (required by schema)
        $principal = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'principal'))->first();
        
        $notice = \App\Models\Notice::create([
            'principal_id' => $principal ? $principal->id : 1,
            'teacher_id' => \Illuminate\Support\Facades\Auth::id(),
            'student_id' => $request->student_id,
            'message' => "**" . $request->title . "**\n\n" . $request->message,
            'status' => 'pending',
        ]);
        
        // Send notification to the student
        $student = \App\Models\User::find($request->student_id);
        if ($student) {
            try {
                $student->notify(new \App\Notifications\SystemNotification(
                    $request->title,
                    $request->message,
                    'warning'
                ));
            } catch (\Throwable $e) {
                logger()->error('Failed to send notice notification', ['error' => $e->getMessage()]);
            }
        }
        
        return response()->json(['message' => 'Notice sent successfully']);
    }

    /**
     * Get aggregate report for Teacher's students over a date range.
     */
    public function reports(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $startDate = $request->get('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end_date', now()->toDateString());
        
        $studentIds = \App\Models\StudentProfile::where('teacher_id', $user->id);
        
        if ($grade = $request->get('grade')) {
            $studentIds->where('grade', $grade);
        }
        if ($section = $request->get('section')) {
            $studentIds->where('section', $section);
        }
        $studentIds = $studentIds->pluck('user_id');

        $attendances = Attendance::whereIn('user_id', $studentIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');
            
        // Daily trend
        $trend = Attendance::whereIn('user_id', $studentIds)
            ->whereBetween('date', [$startDate, $endDate])
            ->select('date', DB::raw('COUNT(*) as value'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'overview' => [
                'present' => $attendances->get('present', 0) + $attendances->get('early', 0),
                'late' => $attendances->get('late', 0),
                'absent' => $attendances->get('absent', 0), 
            ],
            'trend' => $trend,
            'students_count' => $studentIds->count(),
        ]);
    }

    /**
     * Get excuse letters sent to this teacher
     */
    public function getExcuseLetters(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = min((int) $request->get('per_page', 50), 100);

        $letters = ExcuseLetter::where('teacher_id', $user->id)
            ->with(['student' => function ($query) {
                $query->select('id', 'name', 'photo_url')->with('studentProfile:user_id,grade,section');
            }])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($letters);
    }

    /**
     * Approve excuse letter
     */
    public function approveExcuseLetter(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $letter = ExcuseLetter::where('teacher_id', $user->id)->findOrFail($id);
        $letter->update(['status' => 'approved']);

        // Mark the student as excused on the absent date
        Attendance::updateOrCreate(
            [
                'user_id' => $letter->student_id,
                'date' => $letter->absent_date,
            ],
            ['status' => 'excused']
        );

        // Notify Student
        $student = User::find($letter->student_id);
        if ($student) {
            try {
                $student->notify(new ExcuseLetterNotification(
                    "Excuse Letter Approved ✅",
                    "Good news! Your excuse letter for {$letter->absent_date} has been approved by {$user->name}. You are marked as excused for that date.",
                    "excuse_letter_approved"
                ));
            } catch (\Throwable $e) {
                logger('Failed to notify student about excuse letter approval: ' . $e->getMessage());
            }
        }

        // Notify Super Admin
        $admins = User::role('super-admin')->get();
        foreach ($admins as $admin) {
            try {
                $admin->notify(new ExcuseLetterNotification(
                    "Excuse Letter Approved ✅",
                    "{$user->name} approved an excuse letter from {$student->name} for {$letter->absent_date}.",
                    "excuse_letter_approved"
                ));
            } catch (\Throwable $e) {
                logger('Failed to notify admin about excuse letter approval: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Excuse letter approved. The student has been marked as excused for the specified date.', 'letter' => $letter]);
    }

    /**
     * Reject excuse letter
     */
    public function rejectExcuseLetter(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $letter = ExcuseLetter::where('teacher_id', $user->id)->findOrFail($id);
        $wasApproved = $letter->status === 'approved';
        $letter->update(['status' => 'rejected']);

        // Remove the excused attendance record if it was previously approved
        if ($wasApproved) {
            Attendance::where('user_id', $letter->student_id)
                ->where('date', $letter->absent_date)
                ->where('status', 'excused')
                ->delete();
        }

        // Notify Student
        $student = User::find($letter->student_id);
        if ($student) {
            try {
                $student->notify(new ExcuseLetterNotification(
                    "Excuse Letter Rejected ❌",
                    "Your excuse letter for {$letter->absent_date} has been reviewed but was not approved. Please contact your teacher for more details.",
                    "excuse_letter_rejected"
                ));
            } catch (\Throwable $e) {
                logger('Failed to notify student about excuse letter rejection: ' . $e->getMessage());
            }
        }

        // Notify Super Admin
        $admins = User::role('super-admin')->get();
        foreach ($admins as $admin) {
            try {
                $admin->notify(new ExcuseLetterNotification(
                    "Excuse Letter Rejected ❌",
                    "{$user->name} rejected an excuse letter from {$student->name} for {$letter->absent_date}.",
                    "excuse_letter_rejected"
                ));
            } catch (\Throwable $e) {
                logger('Failed to notify admin about excuse letter rejection: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Excuse letter has been reviewed and marked as rejected.', 'letter' => $letter]);
    }

    /**
     * Get leaves for the teacher
     */
    public function getLeaves(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = min((int) $request->get('per_page', 50), 100);

        $leaves = TeacherLeave::with('teacher:id,name')
            ->where('teacher_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($leaves);
    }

    /**
     * Submit a new leave
     */
    public function submitLeave(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('leaves', 'public');
        }

        $leave = TeacherLeave::create([
            'teacher_id' => $user->id,
            'title' => $request->title,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending',
            'attachment_path' => $path,
        ]);

        // Notify Principals
        $principals = User::role('principal')->get();
        foreach ($principals as $principal) {
            $principal->notify(new TeacherLeaveNotification($leave));
        }

        return response()->json(['message' => 'Your leave request has been submitted for review. Please wait for the principal\'s decision.', 'leave' => $leave]);
    }

    /**
     * Delete a leave
     */
    public function deleteLeave(Request $request, string $id): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $leave = TeacherLeave::where('teacher_id', $user->id)->findOrFail($id);
        
        // Delete attachment if exists
        if ($leave->attachment_path) {
            Storage::disk('public')->delete($leave->attachment_path);
        }

        $leave->delete();

        return response()->json(['message' => 'Leave deleted successfully.']);
    }

    /**
     * Get monthly attendance stats for a specific assigned student.
     */
    public function studentAttendanceRecord(Request $request, string $id): \Illuminate\Http\JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        
        $isAssigned = \App\Models\StudentProfile::where('teacher_id', $user->id)
            ->where('user_id', $id)
            ->exists();
            
        if (!$isAssigned) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $attendances = Attendance::where('user_id', $id)
            ->whereYear('date', now()->year)
            ->get();

        $monthlyTrendRaw = $attendances->groupBy(function($att) {
            return \Carbon\Carbon::parse($att->date)->format('Y-m');
        });

        $monthlyTrend = [];
        $currentMonth = now()->month;
        for ($i = 1; $i <= $currentMonth; $i++) {
            $monthStr = now()->year . '-' . str_pad($i, 2, '0', STR_PAD_LEFT);
            $records = $monthlyTrendRaw->get($monthStr, collect());
            
            $monthlyTrend[] = [
                'name' => now()->month($i)->format('M'),
                'present' => $records->whereIn('status', ['present', 'early'])->count(),
                'absent' => $records->where('status', 'absent')->count(),
                'late' => $records->where('status', 'late')->count(),
            ];
        }

        return response()->json($monthlyTrend);
    }
}
