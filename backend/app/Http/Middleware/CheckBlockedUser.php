<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBlockedUser
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_blocked) {
            // Revoke all tokens for this user
            $user->tokens()->delete();

            return response()->json([
                'message' => 'blocked'
            ], 403);
        }

        return $next($request);
    }
}
