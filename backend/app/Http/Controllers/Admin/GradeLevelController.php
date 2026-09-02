<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GradeLevel;

class GradeLevelController extends Controller
{
    public function index(Request $request)
    {
        $query = GradeLevel::query();
        
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        
        // Ensure valid sort direction
        $sortDirection = strtolower($sortDirection) === 'asc' ? 'asc' : 'desc';
        
        // Allowed sort fields
        $allowedSorts = ['id', 'name', 'description', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->input('per_page', 10);
        
        return response()->json($query->paginate($perPage));
    }

    public function listAll()
    {
        return response()->json(GradeLevel::select('id', 'name')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grade_levels',
            'code' => 'nullable|string|max:50|unique:grade_levels',
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        if (!isset($validated['status'])) {
            $validated['status'] = 'active';
        }

        $gradeLevel = GradeLevel::create($validated);

        return response()->json([
            'message' => 'Grade level created successfully',
            'data' => $gradeLevel
        ], 201);
    }

    public function show($id)
    {
        $gradeLevel = GradeLevel::findOrFail($id);
        return response()->json($gradeLevel);
    }

    public function update(Request $request, $id)
    {
        $gradeLevel = GradeLevel::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grade_levels,name,' . $gradeLevel->id,
            'code' => 'nullable|string|max:50|unique:grade_levels,code,' . $gradeLevel->id,
            'description' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $gradeLevel->update($validated);

        return response()->json([
            'message' => 'Grade level updated successfully',
            'data' => $gradeLevel
        ]);
    }

    public function destroy($id)
    {
        $gradeLevel = GradeLevel::findOrFail($id);
        $gradeLevel->delete();

        return response()->json([
            'message' => 'Grade level deleted successfully'
        ]);
    }
}
