<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExcuseLetter extends Model
{
    protected $fillable = [
        'student_id',
        'teacher_id',
        'title',
        'absent_date',
        'reason',
        'status',
        'attachment_path'
    ];

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
