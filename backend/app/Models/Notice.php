<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
    protected $fillable = [
        'principal_id',
        'teacher_id',
        'student_id',
        'message',
        'status',
    ];

    public function principal()
    {
        return $this->belongsTo(User::class, 'principal_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
