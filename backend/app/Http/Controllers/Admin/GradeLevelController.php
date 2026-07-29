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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grade_levels',
            'description' => 'nullable|string'
        ]);

        $gradeLevel = GradeLevel::create($validated);

        return response()->json([
            'message' => 'Grade level created successfully',
            'data' => $gradeLevel
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $gradeLevel = GradeLevel::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:grade_levels,name,' . $gradeLevel->id,
            'description' => 'nullable|string'
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
