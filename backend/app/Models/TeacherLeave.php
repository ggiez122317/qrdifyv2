<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeacherLeave extends Model
{
    protected $fillable = [
        'teacher_id',
        'title',
        'start_date',
        'end_date',
        'reason',
        'status',
        'attachment_path'
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
