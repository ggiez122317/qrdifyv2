<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;
use App\Models\StudentProfile;
use App\Models\Section;
use App\Models\Subject;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TeacherStudentController extends Controller
{
    /**
     * Get students assigned to this teacher (either as adviser or subject teacher).
     */
    public function index(Request $request)
    {
        $teacher = $request->user();

        // Find students where the teacher is their adviser (via section) OR subject teacher (via pivot)
        $students = User::whereHas('roles', fn($q) => $q->where('name', 'student'))
            ->where(function ($query) use ($teacher) {
                // As Adviser
                $query->whereHas('studentProfile.section', function ($q) use ($teacher) {
                    $q->where('adviser_id', $teacher->id);
                });
                // As Adviser (Legacy fallback)
                $query->orWhereHas('studentProfile', function ($q) use ($teacher) {
                    $q->where('teacher_id', $teacher->id);
                });
                // As Subject Teacher
                $query->orWhereHas('subjects', function ($q) use ($teacher) {
                    $q->where('teacher_id', $teacher->id);
                });
            })
            ->with(['studentProfile.section', 'subjects' => function($q) use ($teacher) {
                $q->where('student_subject.teacher_id', $teacher->id);
            }])
            ->get();

        return response()->json($students);
    }

    /**
     * Create a new student and assign them.
     */
    public function store(Request $request)
    {
        $teacher = $request->user();
        $teacher->load('teacherProfile');

        if (!$teacher->teacherProfile?->grade_level || !$teacher->teacherProfile?->section_id) {
            throw ValidationException::withMessages([
                'academic_assignment' => 'Set your grade level and section in Account Settings before adding a student.',
            ]);
        }
        
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255', // Legacy
            'email' => 'required|email|unique:users,email',
            'lrn' => 'nullable|string|unique:users,id_number',
            'id_number' => 'nullable|string|unique:users,id_number', // Legacy
            'parent_name' => 'nullable|string',
            'parent_phone' => 'nullable|string',
            'photo_base64' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'student');
            
            $name = $validated['name'] ?? trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? ''));
            $lrn = $validated['lrn'] ?? $validated['id_number'] ?? null;
            $grade = $teacher->teacherProfile->grade_level;

            // Create user
            $user = User::create([
                'name' => $name,
                'email' => $validated['email'],
                'id_number' => $lrn,
                'password' => Hash::make('password123'),
                'needs_password_change' => true,
                'photo_url' => $photoUrl,
            ]);
            $user->assignRole('student');

            // Create profile
            StudentProfile::create([
                'user_id' => $user->id,
                'grade' => $grade,
                'section_id' => $teacher->teacherProfile->section_id,
                'parent_name' => $validated['parent_name'] ?? null,
                'parent_phone' => $validated['parent_phone'] ?? null,
                'teacher_id' => $teacher->id, // legacy field
            ]);

            DB::commit();
            return response()->json(['message' => 'Student added successfully', 'student' => $user->load('studentProfile.section')], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to add student', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Show a single student.
     */
    public function show(User $student)
    {
        if (!$student->hasRole('student')) {
            return response()->json(['message' => 'User is not a student'], 400);
        }

        $student->load(['studentProfile.section', 'subjects' => function($q) {
            $q->where('student_subject.teacher_id', request()->user()->id);
        }]);

        return response()->json($student);
    }

    /**
     * Update an existing student.
     */
    public function update(Request $request, User $student)
    {
        // Ensure this user is actually a student
        if (!$student->hasRole('student')) {
            return response()->json(['message' => 'User is not a student'], 400);
        }

        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($student->id)],
            'lrn' => ['nullable', 'string', Rule::unique('users')->ignore($student->id)],
            'id_number' => ['nullable', 'string', Rule::unique('users')->ignore($student->id)],
            'grade_level' => 'nullable|string',
            'grade' => 'nullable|string',
            'section_id' => 'required|exists:sections,id',
            'parent_name' => 'nullable|string',
            'parent_phone' => 'nullable|string',
            'photo_base64' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'student');
            
            $name = $validated['name'] ?? trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? '')) ?: $student->name;
            $lrn = $validated['lrn'] ?? $validated['id_number'] ?? $student->id_number;
            $grade = $validated['grade_level'] ?? $validated['grade'] ?? ($student->studentProfile->grade ?? null);

            $updateData = [
                'name' => $name,
                'email' => $validated['email'],
                'id_number' => $lrn,
            ];
            if ($photoUrl) {
                $updateData['photo_url'] = $photoUrl;
            }

            $student->update($updateData);

            $student->studentProfile()->update([
                'grade' => $grade,
                'section_id' => $validated['section_id'],
                'parent_name' => $validated['parent_name'] ?? null,
                'parent_phone' => $validated['parent_phone'] ?? null,
            ]);

            DB::commit();
            return response()->json(['message' => 'Student updated successfully', 'student' => $student->fresh(['studentProfile.section', 'subjects'])]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update student', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a student.
     */
    public function destroy(User $student)
    {
        if (!$student->hasRole('student')) {
            return response()->json(['message' => 'User is not a student'], 400);
        }

        $student->delete();
        return response()->json(['message' => 'Student deleted successfully']);
    }

    public function options()
    {
        $teacher = request()->user();
        $teacher->load('teacherProfile.section');
        
        $sections = Section::where('adviser_id', $teacher->id)
            ->select('id', 'name', 'grade_level')
            ->get();
            
        $subjects = Subject::select('id', 'name')->get();

        $gradeLevels = \App\Models\GradeLevel::select('id', 'name')->orderBy('name')->get();
        
        return response()->json([
            'sections' => $sections,
            'subjects' => $subjects,
            'grade_levels' => $gradeLevels,
            'teacher_assignment' => [
                'grade_level' => $teacher->teacherProfile?->grade_level,
                'section_id' => $teacher->teacherProfile?->section_id,
                'section_name' => $teacher->teacherProfile?->section?->name,
            ],
        ]);
    }

    /**
     * Return the signed-in teacher's profile and student assignment defaults.
     */
    public function settings(Request $request)
    {
        $teacher = $request->user()->load('teacherProfile.section');
        $profile = $teacher->teacherProfile;

        return response()->json([
            'settings' => [
                'display_name' => $teacher->name,
                'email' => $teacher->email,
                'phone_number' => $profile?->contact_number ?? '',
                'grade_level' => $profile?->grade_level ?? '',
                'section_id' => $profile?->section_id,
                'email_notifications' => $profile?->email_notifications ?? true,
                'sms_notifications' => $profile?->sms_notifications ?? false,
            ],
            'grade_levels' => \App\Models\GradeLevel::where('status', '!=', 'inactive')
                ->orWhereNull('status')->select('id', 'name')->orderBy('name')->get(),
            'sections' => Section::where('status', '!=', 'inactive')
                ->orWhereNull('status')->select('id', 'name', 'grade_level')->orderBy('name')->get(),
        ]);
    }

    /**
     * Persist account details and the assignment used for newly added students.
     */
    public function updateSettings(Request $request)
    {
        $teacher = $request->user();
        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($teacher->id)],
            'phone_number' => 'nullable|string|max:30',
            'grade_level' => 'required|exists:grade_levels,name',
            'section_id' => 'nullable|required_without:new_section_name|exists:sections,id',
            'new_section_name' => 'nullable|required_without:section_id|string|max:255',
            'email_notifications' => 'required|boolean',
            'sms_notifications' => 'required|boolean',
        ]);

        $section = DB::transaction(function () use ($teacher, $validated) {
            $section = isset($validated['section_id'])
                ? Section::findOrFail($validated['section_id'])
                : Section::firstOrCreate(
                    [
                        'name' => trim($validated['new_section_name']),
                        'grade_level' => $validated['grade_level'],
                    ],
                    [
                        'status' => 'active',
                        'description' => 'Created from teacher account settings',
                    ]
                );

            if ($section->grade_level !== $validated['grade_level']) {
                throw ValidationException::withMessages([
                    'section_id' => 'The selected section does not belong to the selected grade level.',
                ]);
            }

            $teacher->update([
                'name' => $validated['display_name'],
                'email' => $validated['email'],
            ]);

            $teacher->teacherProfile()->updateOrCreate(
                ['user_id' => $teacher->id],
                [
                    'contact_number' => $validated['phone_number'] ?? null,
                    'grade_level' => $validated['grade_level'],
                    'section_id' => $section->id,
                    'email_notifications' => $validated['email_notifications'],
                    'sms_notifications' => $validated['sms_notifications'],
                ]
            );

            return $section;
        });

        return response()->json([
            'message' => 'Account settings saved successfully.',
            'section' => $section->only(['id', 'name', 'grade_level']),
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
}
