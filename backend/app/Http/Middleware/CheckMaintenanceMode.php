<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Cache::get('maintenance_mode', false)) {
            // Bypass login endpoint so AuthController can check role after auth
            if ($request->is('api/login') || $request->is('login')) {
                return $next($request);
            }

            // Check if user is authenticated and is an admin
            $user = $request->user();
            
            if (!$user || !$user->hasAnyRole(['admin', 'super-admin'])) {
                // If user is authenticated, we might want to log them out too, but returning 503 
                // and letting frontend clear token is fine.
                // However, we can also delete the token here.
                if ($user) {
                    $user->currentAccessToken()->delete();
                }

                return response()->json([
                    'message' => 'maintenance'
                ], 503);
            }
        }

        return $next($request);
    }
}
