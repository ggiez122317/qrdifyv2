<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\School;
use Illuminate\Http\Request;

class SchoolController extends Controller
{
    public function index()
    {
        $schools = School::orderBy('name')->get();
        return response()->json(['data' => $schools]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'student_count' => 'nullable|integer|min:0',
            'status' => 'nullable|string|max:50',
            'geofence_area' => 'nullable|numeric|min:0',
            'boundary' => 'nullable|array',
        ]);

        $school = School::create($data);
        return response()->json(['data' => $school], 201);
    }

    public function show(School $school)
    {
        return response()->json(['data' => $school]);
    }

    public function update(Request $request, School $school)
    {
        $data = $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'student_count' => 'nullable|integer|min:0',
            'status' => 'nullable|string|max:50',
            'geofence_area' => 'nullable|numeric|min:0',
            'boundary' => 'nullable|array',
        ]);

        $school->update($data);
        return response()->json(['data' => $school]);
    }

    public function destroy(School $school)
    {
        $school->delete();
        return response()->json(['message' => 'School deleted successfully']);
    }

    public function stats()
    {
        $totalSchools = School::count();
        $activeGeofences = School::whereNotNull('boundary')->where('boundary', '!=', '[]')->count();
        $totalStudents = School::sum('student_count');
        $totalArea = School::sum('geofence_area');

        return response()->json([
            'data' => [
                'total_schools' => $totalSchools,
                'active_geofences' => $activeGeofences,
                'total_students' => $totalStudents,
                'total_area' => round($totalArea, 2),
            ]
        ]);
    }
}