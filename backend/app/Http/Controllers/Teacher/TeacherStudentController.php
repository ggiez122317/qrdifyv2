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
        
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255', // Legacy
            'email' => 'required|email|unique:users,email',
            'lrn' => 'nullable|string|unique:users,id_number',
            'id_number' => 'nullable|string|unique:users,id_number', // Legacy
            'grade_level' => 'nullable|string',
            'grade' => 'nullable|string', // Legacy
            'section_id' => 'required|exists:sections,id',
            'parent_name' => 'nullable|string',
            'parent_phone' => 'nullable|string',
            'subjects' => 'nullable|array',
            'subjects.*' => 'exists:subjects,id',
            'photo_base64' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $photoUrl = $this->handlePhotoUpload($request, 'student');
            
            $name = $validated['name'] ?? trim(($validated['first_name'] ?? '') . ' ' . ($validated['last_name'] ?? ''));
            $lrn = $validated['lrn'] ?? $validated['id_number'] ?? null;
            $grade = $validated['grade_level'] ?? $validated['grade'] ?? null;

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
                'section_id' => $validated['section_id'],
                'parent_name' => $validated['parent_name'] ?? null,
                'parent_phone' => $validated['parent_phone'] ?? null,
                'teacher_id' => $teacher->id, // legacy field
            ]);

            // Assign subjects if any (with this teacher as the subject teacher)
            if (!empty($validated['subjects'])) {
                foreach ($validated['subjects'] as $subjectId) {
                    $user->subjects()->attach($subjectId, ['teacher_id' => $teacher->id]);
                }
            }

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
        $teacher = $request->user();
        
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
            'subjects' => 'nullable|array',
            'subjects.*' => 'exists:subjects,id',
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

            // Sync subjects for this teacher ONLY
            // First detach all subjects taught by this teacher for this student
            $student->subjects()->wherePivot('teacher_id', $teacher->id)->detach();
            
            // Then attach the new ones
            if (!empty($validated['subjects'])) {
                foreach ($validated['subjects'] as $subjectId) {
                    $student->subjects()->attach($subjectId, ['teacher_id' => $teacher->id]);
                }
            }

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
        
        $sections = Section::where('adviser_id', $teacher->id)
            ->select('id', 'name', 'grade_level')
            ->get();
            
        $subjects = Subject::select('id', 'name')->get();

        $gradeLevels = \App\Models\GradeLevel::select('id', 'name')->orderBy('name')->get();
        
        return response()->json([
            'sections' => $sections,
            'subjects' => $subjects,
            'grade_levels' => $gradeLevels,
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
