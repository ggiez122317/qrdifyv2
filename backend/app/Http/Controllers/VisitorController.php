<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Visitor;

class VisitorController extends Controller
{
    public function index(Request $request)
    {
        $query = Visitor::query();
        
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->has('search') && $request->search != '') {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('person_to_visit', 'like', '%' . $request->search . '%')
                  ->orWhere('purpose', 'like', '%' . $request->search . '%');
            });
        }
        
        return $query->orderBy('created_at', 'desc')->paginate(15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'purpose' => 'required|string|max:255',
            'person_to_visit' => 'required|string|max:255',
            'time_in' => 'required|date',
            'date' => 'required|date',
        ]);

        $visitor = Visitor::create($validated);
        return response()->json($visitor, 201);
    }

    public function update(Request $request, Visitor $visitor)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'purpose' => 'sometimes|required|string|max:255',
            'person_to_visit' => 'sometimes|required|string|max:255',
            'time_out' => 'nullable|date',
            'status' => 'sometimes|in:In,Out',
        ]);

        $visitor->update($validated);
        return response()->json($visitor);
    }

    public function markOut(Request $request, Visitor $visitor)
    {
        $visitor->update([
            'time_out' => now(),
            'status' => 'Out',
        ]);
        return response()->json($visitor);
    }

    public function destroy(Visitor $visitor)
    {
        $visitor->delete();
        return response()->json(null, 204);
    }
}
