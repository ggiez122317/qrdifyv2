<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'description',
        'day_of_week',
        'date',
        'start_time',
        'end_time',
        'is_alarm',
    ];

    protected $casts = [
        'is_alarm' => 'boolean',
        'date' => 'date:Y-m-d',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
