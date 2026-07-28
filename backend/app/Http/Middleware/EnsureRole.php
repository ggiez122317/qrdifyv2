<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     * Ensure the authenticated user has at least one of the specified roles.
     *
     * Usage in routes: middleware('role:principal,admin')
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Spatie HasRoles trait provides hasAnyRole method
        if (!$request->user()->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'Forbidden. You do not have the required roles to access this endpoint.'
            ], 403);
        }

        return $next($request);
    }
}
