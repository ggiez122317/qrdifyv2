<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'author_id',
        'title',
        'content',
        'audience',
        'event_date',
        'event_time',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
