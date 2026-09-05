<?php

namespace Tests\Feature\Attendance;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AttendanceHistoryFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_guard_can_search_attendance_by_id_and_role(): void
    {
        $guard = $this->createUserWithRole('guard', 'Guard Bob', 'G-001');
        $student = $this->createUserWithRole('student', 'Alice Student', 'S-1001');
        $teacher = $this->createUserWithRole('teacher', 'Ben Teacher', 'T-2001');
        $earlyStudent = $this->createUserWithRole('student', 'Early Student', 'S-1002');

        Attendance::create([
            'user_id' => $student->id,
            'date' => '2026-09-04',
            'time_in' => '07:30:00',
            'status' => 'present',
        ]);
        Attendance::create([
            'user_id' => $teacher->id,
            'date' => '2026-09-04',
            'time_in' => '08:15:00',
            'status' => 'late',
        ]);
        Attendance::create([
            'user_id' => $earlyStudent->id,
            'date' => '2026-09-04',
            'time_in' => '06:45:00',
            'status' => 'early',
        ]);

        Sanctum::actingAs($guard);

        $this->getJson('/api/attendance/today?date=2026-09-04&search=S-1001')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.user.name', 'Alice Student');

        $this->getJson('/api/attendance/today?date=2026-09-04&search=teacher')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.user.name', 'Ben Teacher');

        $this->getJson('/api/attendance/today?date=2026-09-04&status=present')
            ->assertOk()
            ->assertJsonPath('total', 2);

        $this->getJson('/api/attendance/stats?date=2026-09-04')
            ->assertOk()
            ->assertJsonPath('overview.present', 2)
            ->assertJsonPath('overview.late', 1)
            ->assertJsonPath('overview.absent', 0);
    }

    public function test_absent_filter_returns_students_and_teachers_without_a_record(): void
    {
        $guard = $this->createUserWithRole('guard', 'Guard Bob', 'G-001');
        $presentStudent = $this->createUserWithRole('student', 'Present Student', 'S-1001');
        $absentStudent = $this->createUserWithRole('student', 'Absent Student', 'S-1002');
        $absentTeacher = $this->createUserWithRole('teacher', 'Absent Teacher', 'T-2001');

        Attendance::create([
            'user_id' => $presentStudent->id,
            'date' => '2026-09-04',
            'time_in' => '07:30:00',
            'status' => 'present',
        ]);
        Attendance::create([
            'user_id' => $absentTeacher->id,
            'date' => '2026-09-04',
            'status' => 'absent',
        ]);

        Sanctum::actingAs($guard);

        $this->getJson('/api/attendance/today?date=2026-09-04&status=absent&search=S-1002')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.user_id', $absentStudent->id)
            ->assertJsonPath('data.0.status', 'absent')
            ->assertJsonPath('data.0.time_in', null);

        $this->getJson('/api/attendance/today?date=2026-09-04&status=absent')
            ->assertOk()
            ->assertJsonPath('total', 2);
    }

    private function createUserWithRole(string $role, string $name, string $idNumber): User
    {
        Role::findOrCreate($role, 'web');

        $user = User::factory()->create([
            'name' => $name,
            'id_number' => $idNumber,
        ]);
        $user->assignRole($role);

        return $user;
    }
}
