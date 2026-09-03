<?php

namespace Tests\Feature\Attendance;

use App\Jobs\SendSmsDelivery;
use App\Models\AttendanceLog;
use App\Models\Setting;
use App\Models\SmsDelivery;
use App\Models\User;
use App\Services\AttendanceService;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AttendanceSmsIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_an_accepted_student_scan_queues_one_audited_sms_delivery(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('scan_deduplication_seconds', '10', 'integer');
        config()->set('sms.school_name', 'QR Academy');
        Carbon::setTestNow('2026-09-02 07:28:00');
        $user = User::factory()->create(['name' => 'Alex Student']);

        $result = $this->service()->processScan(
            'STUDENT-1',
            $this->cachedStudent($user, '0917 123 4567'),
            'scan-request-1',
            'guard-kiosk-1',
        );

        $this->assertFalse($result['duplicate']);
        $this->assertSame('Time In', $result['type']);
        $this->assertDatabaseCount('attendance_logs', 1);
        $this->assertDatabaseHas('attendance_logs', [
            'user_id' => $user->id,
            'type' => 'in',
            'status' => 'present',
            'scan_source' => 'guard-kiosk-1',
            'idempotency_key' => hash('sha256', $user->id.'|scan-request-1'),
        ]);
        $this->assertDatabaseHas('sms_deliveries', [
            'user_id' => $user->id,
            'attendance_log_id' => AttendanceLog::first()->id,
            'recipient' => '+639171234567',
            'event_type' => 'in',
            'status' => 'queued',
        ]);

        $delivery = SmsDelivery::firstOrFail();
        $this->assertSame(
            '[QR Academy] Your child Alex Student entered the school at 07:28 AM.',
            $delivery->message,
        );
        Queue::assertPushed(
            SendSmsDelivery::class,
            fn (SendSmsDelivery $job) => $job->deliveryId === $delivery->id,
        );
    }

    public function test_a_rapid_rescan_is_ignored_before_it_can_toggle_to_time_out(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('scan_deduplication_seconds', '10', 'integer');
        $user = User::factory()->create();
        $cachedUser = $this->cachedStudent($user, '09171234567');

        Carbon::setTestNow('2026-09-02 07:28:00');
        $first = $this->service()->processScan('STUDENT-1', $cachedUser, 'request-1');
        Carbon::setTestNow('2026-09-02 07:28:05');
        $duplicate = $this->service()->processScan('STUDENT-1', $cachedUser, 'request-2');

        $this->assertFalse($first['duplicate']);
        $this->assertTrue($duplicate['duplicate']);
        $this->assertSame('Time In', $duplicate['type']);
        $this->assertDatabaseCount('attendance_logs', 1);
        $this->assertDatabaseCount('sms_deliveries', 1);
        Queue::assertPushed(SendSmsDelivery::class, 1);
    }

    public function test_replaying_an_idempotency_key_is_ignored_even_after_the_cooldown(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('scan_deduplication_seconds', '10', 'integer');
        $user = User::factory()->create();
        $cachedUser = $this->cachedStudent($user, '09171234567');

        Carbon::setTestNow('2026-09-02 07:28:00');
        $this->service()->processScan('STUDENT-1', $cachedUser, 'same-request');
        Carbon::setTestNow('2026-09-02 07:30:00');
        $duplicate = $this->service()->processScan('STUDENT-1', $cachedUser, 'same-request');

        $this->assertTrue($duplicate['duplicate']);
        $this->assertDatabaseCount('attendance_logs', 1);
        $this->assertDatabaseCount('sms_deliveries', 1);
        Queue::assertPushed(SendSmsDelivery::class, 1);
    }

    public function test_a_new_scan_after_the_cooldown_creates_a_time_out_and_second_sms(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('scan_deduplication_seconds', '10', 'integer');
        $user = User::factory()->create();
        $cachedUser = $this->cachedStudent($user, '+63 917 123 4567');

        Carbon::setTestNow('2026-09-02 07:28:00');
        $this->service()->processScan('STUDENT-1', $cachedUser, 'request-1');
        Carbon::setTestNow('2026-09-02 07:28:11');
        $second = $this->service()->processScan('STUDENT-1', $cachedUser, 'request-2');

        $this->assertFalse($second['duplicate']);
        $this->assertSame('Time Out (Log)', $second['type']);
        $this->assertDatabaseCount('attendance_logs', 2);
        $this->assertDatabaseCount('sms_deliveries', 2);
        $this->assertSame(['in', 'out'], SmsDelivery::orderBy('id')->pluck('event_type')->all());
        Queue::assertPushed(SendSmsDelivery::class, 2);
    }

    public function test_sms_is_not_created_when_the_feature_is_disabled(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'false', 'boolean');
        Carbon::setTestNow('2026-09-02 07:28:00');
        $user = User::factory()->create();

        $result = $this->service()->processScan(
            'STUDENT-1',
            $this->cachedStudent($user, '09171234567'),
        );

        $this->assertFalse($result['duplicate']);
        $this->assertDatabaseCount('attendance_logs', 1);
        $this->assertDatabaseCount('sms_deliveries', 0);
        Queue::assertNothingPushed();
    }

    public function test_check_in_sms_is_not_created_when_check_in_notifications_are_disabled(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('notify_check_in', 'false', 'boolean');
        Carbon::setTestNow('2026-09-02 07:28:00');
        $user = User::factory()->create();

        $result = $this->service()->processScan(
            'STUDENT-1',
            $this->cachedStudent($user, '09171234567'),
        );

        $this->assertFalse($result['duplicate']);
        $this->assertDatabaseCount('attendance_logs', 1);
        $this->assertDatabaseCount('sms_deliveries', 0);
        Queue::assertNothingPushed();
    }

    public function test_late_sms_is_not_created_when_late_notifications_are_disabled(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('notify_late', 'false', 'boolean');
        Carbon::setTestNow('2026-09-02 07:46:00');
        $user = User::factory()->create();

        $result = $this->service()->processScan(
            'STUDENT-1',
            $this->cachedStudent($user, '09171234567'),
        );

        $this->assertSame('late', $result['status']);
        $this->assertDatabaseCount('attendance_logs', 1);
        $this->assertDatabaseCount('sms_deliveries', 0);
        Queue::assertNothingPushed();
    }

    public function test_early_time_out_sms_is_not_created_when_early_notifications_are_disabled(): void
    {
        Queue::fake();
        Event::fake();
        $this->setSetting('enable_sms_notifications', 'true', 'boolean');
        $this->setSetting('scan_deduplication_seconds', '10', 'integer');
        $this->setSetting('notify_early', 'false', 'boolean');
        $user = User::factory()->create();
        $cachedUser = $this->cachedStudent($user, '09171234567');

        Carbon::setTestNow('2026-09-02 07:28:00');
        $this->service()->processScan('STUDENT-1', $cachedUser, 'request-1');
        Carbon::setTestNow('2026-09-02 07:28:11');
        $timeOut = $this->service()->processScan('STUDENT-1', $cachedUser, 'request-2');

        $this->assertSame('Time Out (Log)', $timeOut['type']);
        $this->assertDatabaseCount('attendance_logs', 2);
        $this->assertDatabaseCount('sms_deliveries', 1);
        $this->assertSame('in', SmsDelivery::sole()->event_type);
        Queue::assertPushed(SendSmsDelivery::class, 1);
    }

    private function service(): AttendanceService
    {
        return app(AttendanceService::class);
    }

    private function cachedStudent(User $user, ?string $parentPhone): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'role' => 'student',
            'teacher_id' => null,
            'parent_phone' => $parentPhone,
            'photo_url' => null,
            'grade' => '6',
            'section' => 'A',
        ];
    }

    private function setSetting(string $key, string $value, string $type): void
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'type' => $type, 'description' => $key],
        );
        app(SettingsService::class)->clearCache();
    }
}
