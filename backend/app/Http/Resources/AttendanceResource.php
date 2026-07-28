<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'date' => $this->date,
            'time_in' => $this->time_in,
            'time_out' => $this->time_out,
            'status' => $this->status,
            'am_status' => $this->am_status,
            'pm_status' => $this->pm_status,
            'user' => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'created_at' => $this->created_at,
        ];
    }
}
