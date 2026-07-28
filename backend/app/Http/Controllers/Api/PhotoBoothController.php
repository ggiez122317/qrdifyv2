<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class PhotoBoothController extends Controller
{
    public function missingPhotos()
    {
        $users = User::whereNull('photo_url')
            ->whereHas('roles', function ($q) {
                $q->whereIn('name', ['student', 'teacher']);
            })
            ->with(['roles', 'student_profile', 'teacher_profile'])
            ->get();

        $formatted = $users->map(function ($user) {
            $roleName = $user->hasRole('teacher') ? 'Teacher' : 'Student';
            $details = '';
            
            if ($roleName === 'Student' && $user->student_profile) {
                $details = "Grade {$user->student_profile->grade} - {$user->student_profile->section}";
            } elseif ($roleName === 'Teacher' && $user->teacher_profile) {
                $details = $user->teacher_profile->position ?? 'Teacher';
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $roleName,
                'details' => $details,
                'lrn' => $user->id_number,
                'id_number' => $user->id_number,
                'student_profile' => $user->student_profile,
                'teacher_profile' => $user->teacher_profile,
            ];
        });

        return response()->json($formatted);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'photo_base64' => 'required|string',
        ]);

        $user = User::findOrFail($request->user_id);

        $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $request->photo_base64));
        $filename = 'photobooth_' . time() . '_' . uniqid() . '.jpg';
        \Illuminate\Support\Facades\Storage::disk('public')->put('photos/' . $filename, $imageData);
        
        $user->photo_url = '/storage/photos/' . $filename;
        $user->save();

        return response()->json([
            'message' => 'Photo uploaded successfully',
            'photo_url' => $user->photo_url,
        ]);
    }
}
