<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'attendance_log_id',
        'deduplication_key',
        'recipient',
        'event_type',
        'message',
        'provider',
        'status',
        'attempts',
        'provider_response',
        'last_error',
        'accepted_at',
        'failed_at',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'accepted_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attendanceLog(): BelongsTo
    {
        return $this->belongsTo(AttendanceLog::class);
    }
}
