<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'id_number' => $this->id_number,
            'photo_url' => $this->photo_url,
            'roles' => $this->getRoleNames(),
            'is_blocked' => $this->is_blocked,
            'student_profile' => $this->whenLoaded('studentProfile', fn() => new StudentProfileResource($this->studentProfile)),
            'teacher_profile' => $this->whenLoaded('teacherProfile', fn() => new TeacherProfileResource($this->teacherProfile)),
            'created_at' => $this->created_at,
        ];
    }
}
