<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('teacher');

        return [
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email,' . $id,
            'employee_id'   => 'nullable|string|max:50|unique:users,id_number,' . $id,
            'position'      => 'nullable|string|max:100',
            'phone'         => 'nullable|string|max:20',
            'photo_base64'  => 'nullable|string',
        ];
    }
}
