<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:feedback,review',
            'content' => 'required|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        $feedback = $request->user()->feedbacks()->create($validated);

        return response()->json($feedback, 201);
    }
}
