<?php

namespace App\Http\Controllers\Api;

use App\Events\AnnouncementBroadcasted;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnnouncementRequest;
use App\Models\Announcement;
use App\Models\AnnouncementTemplate;
use App\Models\Notice;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrincipalController extends Controller
{
    /**
     * Get all employees (teachers, guards, etc.) with pagination.
     */
    public function getEmployees(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        $employees = User::employees()
            ->where('id', '!=', $request->user()->id)
            ->with('roles:id,name')
            ->paginate($perPage);

        return response()->json($employees);
    }

    /**
     * Get students at risk (those with absences or issues).
     *
     * OPTIMIZATION: Uses subqueries to count absences and lates directly in SQL,
     * preventing the N+1 issue of loading all attendances into PHP memory.
     */
    public function getStudentsAtRisk(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        // Subqueries for absence and late counts
        $absencesQuery = DB::table('attendances')
            ->selectRaw('count(*)')
            ->whereColumn('attendances.user_id', 'users.id')
            ->where('status', 'absent');

        $latesQuery = DB::table('attendances')
            ->selectRaw('count(*)')
            ->whereColumn('attendances.user_id', 'users.id')
            ->where('status', 'late');

        $students = User::students()
            ->with('studentProfile.teacher:id,name')
            ->select('users.id', 'users.name', 'users.email', 'users.id_number', 'users.photo_url')
            ->selectSub($absencesQuery, 'absences_count')
            ->selectSub($latesQuery, 'lates_count')
            // Order by highest risk first: combine absences and lates as a proxy for risk score
            ->orderByRaw('(COALESCE((' . $absencesQuery->toSql() . '), 0) * 2) + COALESCE((' . $latesQuery->toSql() . '), 0) DESC', array_merge(
                $absencesQuery->getBindings(),
                $latesQuery->getBindings()
            ))
            ->paginate($perPage);

        $students->getCollection()->transform(function ($student) {
            $absences = (int) $student->absences_count;
            $lates    = (int) $student->lates_count;

            $riskLevel = 'Low';
            if ($absences >= 3) {
                $riskLevel = 'High';
            } elseif ($absences > 0 || $lates >= 3) {
                $riskLevel = 'Medium';
            }

            return [
                'id'         => $student->id,
                'name'       => $student->name,
                'email'      => $student->email,
                'id_number'  => $student->id_number,
                'photo_url'  => $student->photo_url,
                'grade'      => $student->studentProfile->grade ?? 'N/A',
                'section'    => $student->studentProfile->section ?? 'N/A',
                'teacher'    => $student->studentProfile->teacher->name ?? 'Unassigned',
                'teacher_id' => $student->studentProfile->teacher_id ?? null,
                'absences'   => $absences,
                'lates'      => $lates,
                'risk_level' => $riskLevel,
            ];
        });

        return response()->json($students);
    }

    /**
     * Send a notice to a teacher regarding a student.
     */
    public function sendNotice(Request $request): JsonResponse
    {
        $request->validate([
            'teacher_id' => 'nullable|exists:users,id',
            'student_id' => 'required|exists:users,id',
            'message'    => 'required|string',
        ]);

        $notice = Notice::create([
            'principal_id' => $request->user()->id,
            'teacher_id'   => $request->teacher_id,
            'student_id'   => $request->student_id,
            'message'      => $request->message,
            'status'       => 'pending',
        ]);

        // Notify Student
        $student = User::find($request->student_id);
        if ($student) {
            $student->notify(new \App\Notifications\SystemNotification(
                'New Principal Notice',
                "You have received a new notice from the Principal.",
                'warning'
            ));
        }

        // Notify Teacher if exists
        if ($request->teacher_id) {
            $teacher = User::find($request->teacher_id);
            if ($teacher) {
                $teacher->notify(new \App\Notifications\SystemNotification(
                    'Notice Regarding Student',
                    "The Principal has sent a notice regarding your student, {$student->name}.",
                    'warning'
                ));
            }
        }

        return response()->json(['message' => 'Notice sent successfully', 'notice' => $notice], 201);
    }

    /**
     * Get all notices sent by the principal.
     */
    public function getNotices(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        $notices = Notice::with(['teacher:id,name', 'student:id,name,id_number'])
            ->where('principal_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($notices);
    }

    /**
     * Broadcast a new announcement.
     */
    public function broadcastAnnouncement(StoreAnnouncementRequest $request): JsonResponse
    {
        $announcement = Announcement::create([
            'author_id'  => $request->user()->id,
            'title'      => $request->title,
            'content'    => $request->content,
            'audience'   => $request->audience,
            'event_date' => $request->event_date,
            'event_time' => $request->event_time,
        ]);

        if ($request->save_template) {
            AnnouncementTemplate::firstOrCreate([
                'title'    => $request->title,
                'content'  => $request->content,
                'audience' => $request->audience,
            ], [
                'author_id' => $request->user()->id,
            ]);
        }

        broadcast(new AnnouncementBroadcasted($announcement));

        return response()->json(['message' => 'Announcement broadcasted successfully', 'announcement' => $announcement], 201);
    }

    /**
     * Get all announcements with pagination.
     */
    public function getAnnouncements(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        $announcements = Announcement::with('author:id,name')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($announcements);
    }

    /**
     * Update an announcement.
     */
    public function updateAnnouncement(StoreAnnouncementRequest $request, $id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);

        $announcement->update([
            'title'      => $request->title,
            'content'    => $request->content,
            'audience'   => $request->audience,
            'event_date' => $request->event_date,
            'event_time' => $request->event_time,
        ]);

        return response()->json(['message' => 'Announcement updated successfully', 'announcement' => $announcement]);
    }

    /**
     * Delete an announcement.
     */
    public function deleteAnnouncement($id): JsonResponse
    {
        $announcement = Announcement::findOrFail($id);
        $announcement->delete();

        return response()->json(['message' => 'Announcement deleted successfully']);
    }

    /**
     * Get students currently with attendance today.
     * Returns students who have scanned in (no fabricated GPS data).
     */
    public function getOnlineStudents(Request $request): JsonResponse
    {
        $today = now()->toDateString();

        $students = User::students()
            ->with('studentProfile.teacher:id,name')
            ->whereHas('attendances', fn($q) => $q->where('date', $today))
            ->take(20)
            ->get()
            ->map(function ($student) {
                return [
                    'id'           => $student->id,
                    'name'         => $student->name,
                    'photo_url'    => $student->photo_url,
                    'id_number'    => $student->id_number,
                    'teacher_name' => $student->studentProfile->teacher->name ?? 'N/A',
                    'grade_level'  => $student->studentProfile->grade ?? 'N/A',
                    'section'      => $student->studentProfile->section ?? 'N/A',
                ];
            });

        return response()->json($students);
    }

    /**
     * Get all announcement templates.
     */
    public function getAnnouncementTemplates(Request $request): JsonResponse
    {
        $templates = AnnouncementTemplate::where('author_id', $request->user()->id)
            ->orderBy('title', 'asc')
            ->get();

        return response()->json($templates);
    }
}
