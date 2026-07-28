<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'grade' => $this->grade,
            'section' => $this->section,
            'parent_name' => $this->parent_name,
            'parent_phone' => $this->parent_phone,
            'teacher_id' => $this->teacher_id,
            'teacher' => $this->whenLoaded('teacher', fn() => [
                'id' => $this->teacher->id,
                'name' => $this->teacher->name,
            ]),
        ];
    }
}
