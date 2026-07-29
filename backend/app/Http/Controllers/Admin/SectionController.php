<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Section;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $query = Section::query();
        
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
        }

        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        
        $sortDirection = strtolower($sortDirection) === 'asc' ? 'asc' : 'desc';
        
        $allowedSorts = ['id', 'name', 'code', 'created_at'];
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
        return response()->json(Section::select('id', 'name')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255|unique:sections',
            'description' => 'nullable|string',
            'grade_level' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        if (!isset($validated['status'])) {
            $validated['status'] = 'active';
        }

        $section = Section::create($validated);

        return response()->json([
            'message' => 'Section created successfully',
            'data' => $section
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $section = Section::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255|unique:sections,code,' . $section->id,
            'description' => 'nullable|string',
            'grade_level' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive'
        ]);

        $section->update($validated);

        return response()->json([
            'message' => 'Section updated successfully',
            'data' => $section
        ]);
    }

    public function destroy($id)
    {
        $section = Section::findOrFail($id);
        $section->delete();

        return response()->json([
            'message' => 'Section deleted successfully'
        ]);
    }
}
