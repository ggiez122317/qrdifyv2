<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    protected $fillable = ['name', 'type', 'latitude', 'longitude', 'student_count', 'status', 'geofence_area', 'boundary'];

    protected function casts(): array
    {
        return [
            'boundary' => 'array',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }
}