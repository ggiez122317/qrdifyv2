<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\Notice;
use Carbon\Carbon;

class MapController extends Controller
{
    public function getGeofence()
    {
        $setting = Setting::where('key', 'campus_geofence')->first();
        return response()->json([
            'geofence' => $setting ? json_decode($setting->value) : null
        ]);
    }

    public function saveGeofence(Request $request)
    {
        $request->validate([
            'coordinates' => 'required|array|min:3',
        ], [
            'coordinates.min' => 'A geofence boundary requires at least 3 points to form a polygon.',
        ]);

        $setting = Setting::updateOrCreate(
            ['key' => 'campus_geofence'],
            ['value' => json_encode($request->coordinates), 'type' => 'json', 'description' => 'Campus Boundary Polygon']
        );

        return response()->json(['message' => 'Geofence saved successfully']);
    }

    public function deleteGeofence()
    {
        Setting::where('key', 'campus_geofence')->delete();
        return response()->json(['message' => 'Geofence cleared successfully']);
    }

    public function getStudentLocations()
    {
        // Get all students who have reported location in the last 15 minutes
        $profiles = StudentProfile::with(['user', 'section'])
            ->whereNotNull('last_latitude')
            ->whereNotNull('last_longitude')
            ->where('last_location_update', '>=', Carbon::now()->subMinutes(15))
            ->get();

        $students = $profiles->map(function ($profile) {
            return [
                'id' => $profile->user_id,
                'name' => $profile->user->name,
                'latitude' => $profile->last_latitude,
                'longitude' => $profile->last_longitude,
                'last_update' => $profile->last_location_update,
                'grade' => $profile->grade,
                'section' => $profile->section ? $profile->section->name : null,
                'photo_url' => $profile->user->photo_url,
            ];
        });

        return response()->json(['data' => $students]);
    }

    public function reportLocation(Request $request)
    {
        $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $user = $request->user();
        $profile = StudentProfile::where('user_id', $user->id)->first();

        if (!$profile) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        $profile->last_latitude = $request->latitude;
        $profile->last_longitude = $request->longitude;
        $profile->last_location_update = Carbon::now();
        $profile->save();

        $isOutOfBounds = false;
        $geofenceSetting = Setting::where('key', 'campus_geofence')->first();
        
        if ($geofenceSetting && $geofenceSetting->value) {
            $polygon = json_decode($geofenceSetting->value, true);
            if (is_array($polygon) && count($polygon) >= 3) {
                if (!$this->isPointInPolygon([$request->latitude, $request->longitude], $polygon)) {
                    $isOutOfBounds = true;
                    // Trigger notice to adviser if not already triggered recently (e.g. within last hour)
                    if ($profile->teacher_id) {
                        $recentNotice = Notice::where('sender_id', $user->id)
                            ->where('recipient_id', $profile->teacher_id)
                            ->where('title', 'Student Out of Bounds')
                            ->where('created_at', '>=', Carbon::now()->subMinutes(30))
                            ->first();

                        if (!$recentNotice) {
                            Notice::create([
                                'sender_id' => $user->id,
                                'recipient_id' => $profile->teacher_id,
                                'title' => 'Student Out of Bounds',
                                'message' => $user->name . ' is currently outside the campus boundary!',
                                'type' => 'alert',
                                'status' => 'unread'
                            ]);
                        }
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Location updated',
            'out_of_bounds' => $isOutOfBounds
        ]);
    }

    private function isPointInPolygon($point, $polygon)
    {
        $x = $point[0]; // lat
        $y = $point[1]; // lng
        $inside = false;
        
        for ($i = 0, $j = count($polygon) - 1; $i < count($polygon); $j = $i++) {
            $xi = $polygon[$i]['lat'];
            $yi = $polygon[$i]['lng'];
            $xj = $polygon[$j]['lat'];
            $yj = $polygon[$j]['lng'];
            
            $intersect = (($yi > $y) != ($yj > $y))
                && ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }
        
        return $inside;
    }
}
