<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The email or password you entered is incorrect. Please check your credentials and try again.'
            ], 401);
        }

        if ($user->is_blocked) {
            return response()->json([
                'message' => 'blocked'
            ], 403);
        }

        if (\Illuminate\Support\Facades\Cache::get('maintenance_mode', false)) {
            if (!$user->hasAnyRole(['admin', 'super-admin'])) {
                return response()->json([
                    'message' => 'maintenance'
                ], 503);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => (new UserResource($user))->toArray($request),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->needs_password_change = false;
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully',
            'user' => new UserResource($user),
        ]);
    }
}
