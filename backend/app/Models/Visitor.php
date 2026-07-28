<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visitor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'purpose',
        'person_to_visit',
        'time_in',
        'time_out',
        'date',
        'status',
    ];

    protected $casts = [
        'time_in' => 'datetime',
        'time_out' => 'datetime',
        'date' => 'date',
    ];
}
