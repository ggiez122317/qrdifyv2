<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\ActivityLog;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\JsonResponse;

class SystemController extends Controller
{
    /**
     * Get maintenance status.
     */
    public function getMaintenanceStatus(): JsonResponse
    {
        $isMaintenanceMode = Cache::get('maintenance_mode', false);
        return response()->json(['maintenance_mode' => $isMaintenanceMode]);
    }

    /**
     * Toggle maintenance mode.
     */
    public function toggleMaintenance(Request $request): JsonResponse
    {
        $currentStatus = Cache::get('maintenance_mode', false);
        $newStatus = !$currentStatus;
        
        Cache::put('maintenance_mode', $newStatus); // Store permanently or until cleared

        $action = $newStatus ? "Enabled Maintenance Mode" : "Disabled Maintenance Mode";
        
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => $action,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => $action,
            'maintenance_mode' => $newStatus
        ]);
    }

    /**
     * Get paginated activity logs.
     */
    public function getLogs(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);
        $query = ActivityLog::with('user:id,name,email,photo_url');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($builder) use ($search) {
                $builder->where('action', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get paginated users for user management.
     */
    public function getUsers(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 50), 100);
        $query = User::with('roles')->orderBy('created_at', 'desc');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id_number', 'like', "%{$search}%")
                  ->orWhereHas('roles', fn ($roleQuery) => $roleQuery->where('name', 'like', "%{$search}%"));
            });
        }

        return response()->json($query->paginate($perPage));
    }

    /**
     * Store a new user with dynamic roles.
     */
    public function storeUser(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
            'id_number' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'id_number' => $request->id_number,
        ]);

        $user->assignRole($request->role);

        // Create empty profile if needed for specific roles
        if ($request->role === 'student') {
            StudentProfile::create(['user_id' => $user->id]);
        } elseif ($request->role === 'teacher') {
            TeacherProfile::create(['user_id' => $user->id]);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => "Created new {$request->role} user: {$user->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'User created successfully', 'user' => $user->load('roles')]);
    }

    /**
     * Block or unblock a user.
     */
    public function blockUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        // Prevent blocking oneself
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot block yourself'], 400);
        }

        $user->is_blocked = !$user->is_blocked;
        $user->save();

        $action = $user->is_blocked ? "Blocked user" : "Unblocked user";
        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => "{$action}: {$user->name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => "User {$action} successfully"]);
    }

    /**
     * Terminate/delete a user.
     */
    public function destroyUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting oneself
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself'], 400);
        }

        $name = $user->name;
        $user->delete();

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => "Terminated user account: {$name}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['message' => 'User account terminated successfully']);
    }
}
