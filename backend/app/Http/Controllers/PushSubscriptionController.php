<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PushSubscriptionController extends Controller
{
    /**
     * Subscribe the user to Web Push Notifications.
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint'    => 'required',
            'keys.auth'   => 'required',
            'keys.p256dh' => 'required'
        ]);

        $endpoint = $request->endpoint;
        $token = $request->keys['auth'];
        $key = $request->keys['p256dh'];
        
        $user = $request->user();

        $user->updatePushSubscription($endpoint, $key, $token);

        return response()->json(['success' => true]);
    }

    /**
     * Unsubscribe the user from Web Push Notifications.
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required'
        ]);

        $user = $request->user();
        $user->deletePushSubscription($request->endpoint);

        return response()->json(['success' => true]);
    }
}
