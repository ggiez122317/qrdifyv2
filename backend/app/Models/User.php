<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
     * Student profile.
     * Laravel auto-maps both 'studentProfile' and 'student_profile' to this method.
     */
    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Teacher profile.
     * Laravel auto-maps both 'teacherProfile' and 'teacher_profile' to this method.
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

    /**
     * Sections where this user (teacher) is the adviser.
     */
    public function advisedSections(): HasMany
    {
        return $this->hasMany(Section::class, 'adviser_id');
    }

    /**
     * Subjects taught by this user (teacher) to students.
     * We can define a belongsToMany relationship through student_subject pivot table.
     */
    public function taughtSubjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'student_subject', 'teacher_id', 'subject_id')
                    ->withPivot('student_id')
                    ->distinct();
    }

    /**
     * Students taught by this user (teacher) across different subjects.
     */
    public function studentsTaught(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_subject', 'teacher_id', 'student_id')
                    ->withPivot('subject_id')
                    ->distinct();
    }

    /**
     * Subjects taken by this user (student).
     */
    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'student_subject', 'student_id', 'subject_id')
                    ->withPivot('teacher_id')
                    ->withTimestamps();
    }
}
