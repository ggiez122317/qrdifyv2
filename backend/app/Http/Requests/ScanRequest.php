<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_number' => 'required|string|max:50',
            'idempotency_key' => 'nullable|string|max:128',
            'scan_source' => 'nullable|string|max:64',
        ];
    }

    public function messages(): array
    {
        return [
            'id_number.required' => 'RFID or ID number is required to scan.',
        ];
    }
}
