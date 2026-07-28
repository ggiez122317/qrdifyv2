<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email',
            'lrn'           => 'nullable|string|max:50|unique:users,id_number',
            'grade_level'   => 'nullable|string|max:20',
            'section'       => 'nullable|string|max:50',
            'parent_name'   => 'nullable|string|max:100',
            'parent_phone'  => 'nullable|string|max:20',
            'photo_base64'  => 'nullable|string',
        ];
    }
}
