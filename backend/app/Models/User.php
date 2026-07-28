<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use NotificationChannels\WebPush\HasPushSubscriptions;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens, HasPushSubscriptions;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'id_number',
        'password',
        'photo_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_blocked' => 'boolean',
        ];
    }

    // ─── Relationships ─────────────────────────────────────

    /**
     * Student profile (snake_case — kept for backward compatibility).
     */
    public function student_profile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Student profile (camelCase — Laravel convention).
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Teacher profile (snake_case — kept for backward compatibility).
     */
    public function teacher_profile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    /**
     * Teacher profile (camelCase — Laravel convention).
     */
    public function teacherProfile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    /**
     * All attendance records for this user.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    public function leaves()
    {
        return $this->hasMany(TeacherLeave::class, 'teacher_id');
    }

    public function feedbacks()
    {
        return $this->hasMany(Feedback::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    // ─── Query Scopes ──────────────────────────────────────

    /**
     * Scope to only students.
     */
    public function scopeStudents(Builder $query): Builder
    {
        return $query->whereHas('roles', fn($q) => $q->where('name', 'student'));
    }

    /**
     * Scope to only employees (teachers, guards, principals).
     */
    public function scopeEmployees(Builder $query): Builder
    {
        return $query->whereHas('roles', fn($q) => $q->whereIn('name', ['teacher', 'guard', 'principal']));
    }

    /**
     * Scope to only teachers.
     */
    public function scopeTeachers(Builder $query): Builder
    {
        return $query->whereHas('roles', fn($q) => $q->where('name', 'teacher'));
    }
}
