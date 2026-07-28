<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        return response()->json(
            $request->user()->notifications()->paginate($perPage)
        );
    }

    public function markAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['message' => 'Notifications marked as read.']);
    }

    public function markOneAsRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['message' => 'Notification marked as read.']);
    }
}
