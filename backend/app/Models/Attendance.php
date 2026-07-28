<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    /**
     * Explicit fillable fields to prevent mass-assignment vulnerabilities.
     * Never use $guarded = [] in production.
     */
    protected $fillable = [
        'user_id',
        'date',
        'time_in',
        'time_out',
        'status',
        'am_status',
        'pm_status',
        'remarks',
    ];

    /**
     * Attribute casting for proper type handling.
     */
    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
        ];
    }

    // ─── Relationships ─────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Query Scopes ──────────────────────────────────────

    /**
     * Filter attendance records for a specific date.
     * Defaults to today if no date provided.
     */
    public function scopeForDate(Builder $query, ?string $date = null): Builder
    {
        return $query->where('date', $date ?? now()->toDateString());
    }

    /**
     * Filter attendance records for a specific user.
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Filter by one or more statuses.
     */
    public function scopeWithStatus(Builder $query, array|string $statuses): Builder
    {
        return $query->whereIn('status', (array) $statuses);
    }
}
