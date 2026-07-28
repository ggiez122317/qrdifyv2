<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('student');

        return [
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email,' . $id,
            'lrn'           => 'nullable|string|max:50|unique:users,id_number,' . $id,
            'grade_level'   => 'nullable|string|max:20',
            'section'       => 'nullable|string|max:50',
            'parent_name'   => 'nullable|string|max:100',
            'parent_phone'  => 'nullable|string|max:20',
            'photo_base64'  => 'nullable|string',
        ];
    }
}
