<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'          => 'required|string|max:255',
            'content'        => 'required|string|max:5000',
            'audience'       => 'required|in:all,staff,students_parents',
            'event_date'     => 'nullable|date',
            'event_time'     => 'nullable|date_format:H:i',
            'save_template'  => 'nullable|boolean',
        ];
    }
}
