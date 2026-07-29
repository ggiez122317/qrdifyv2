<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 50), 100);

        $query = $request->user()->notifications();

        if ($type = $request->get('type')) {
            $query->where('data->type', $type);
        }

        return response()->json(
            $query->paginate($perPage)
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

    public function destroy(Request $request, $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->delete();
        }
        return response()->json(['message' => 'Notification deleted.']);
    }

    public function destroySelected(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'string']);
        $request->user()->notifications()->whereIn('id', $request->ids)->delete();
        return response()->json(['message' => 'Selected notifications deleted.']);
    }
}