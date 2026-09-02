<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'status',
        'scanned_at',
        'idempotency_key',
        'scan_source',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function smsDeliveries(): HasMany
    {
        return $this->hasMany(SmsDelivery::class);
    }
}
