<?php

namespace Tests\Feature\Sms;

use App\Jobs\SendSmsDelivery;
use App\Models\SmsDelivery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PrincipalTestSmsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_an_admin_can_queue_an_audited_sms_to_the_entered_number(): void
    {
        Queue::fake();
        Carbon::setTestNow('2026-09-02 10:15:00');
        config()->set('sms.school_name', 'QR Academy');
        $admin = $this->actingAsAdmin();

        $response = $this->postJson('/api/system/preferences/test-sms', [
            'phone_number' => '0917 123 4567',
        ]);

        $response->assertAccepted()
            ->assertJsonPath('recipient', '+639171234567')
            ->assertJsonPath('message', 'Test SMS queued for +639171234567.');

        $delivery = SmsDelivery::firstOrFail();
        $this->assertSame($admin->id, $delivery->user_id);
        $this->assertNull($delivery->attendance_log_id);
        $this->assertSame('test', $delivery->event_type);
        $this->assertSame('queued', $delivery->status);
        $this->assertSame('+639171234567', $delivery->recipient);
        $this->assertSame(
            "[QR Academy] Test SMS requested by {$admin->name} at 10:15 AM. The SMS integration is working.",
            $delivery->message,
        );
        Queue::assertPushed(
            SendSmsDelivery::class,
            fn (SendSmsDelivery $job) => $job->deliveryId === $delivery->id,
        );
    }

    public function test_an_invalid_test_recipient_is_rejected_without_a_delivery(): void
    {
        Queue::fake();
        $this->actingAsAdmin();

        $this->postJson('/api/system/preferences/test-sms', [
            'phone_number' => '12345',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('phone_number');

        $this->assertDatabaseCount('sms_deliveries', 0);
        Queue::assertNothingPushed();
    }

    public function test_settings_update_persists_a_new_test_phone_number(): void
    {
        $this->actingAsAdmin();

        $this->postJson('/api/system/preferences', [
            'settings' => [
                'phone_number' => '09171234567',
                'enable_sms_notifications' => true,
            ],
        ])->assertOk();

        $this->assertDatabaseHas('settings', [
            'key' => 'phone_number',
            'value' => '09171234567',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'enable_sms_notifications',
            'value' => 'true',
        ]);
    }

    public function test_a_principal_cannot_use_the_admin_modem_test_endpoint(): void
    {
        Queue::fake();
        $this->actingAsPrincipal();

        $this->postJson('/api/system/preferences/test-sms', [
            'phone_number' => '09171234567',
        ])->assertForbidden();

        $this->assertDatabaseCount('sms_deliveries', 0);
        Queue::assertNothingPushed();
    }

    public function test_a_principal_cannot_update_sms_settings(): void
    {
        $this->actingAsPrincipal();

        $this->postJson('/api/principal/settings', [
            'settings' => [
                'enable_sms_notifications' => true,
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('settings');

        $this->assertDatabaseMissing('settings', [
            'key' => 'enable_sms_notifications',
            'value' => 'true',
        ]);
    }

    public function test_a_principal_can_still_update_attendance_schedule_settings(): void
    {
        $this->actingAsPrincipal();

        $response = $this->postJson('/api/principal/settings', [
            'settings' => [
                'school_start_time' => '07:30',
                'late_threshold' => '07:45',
                'school_end_time' => '16:30',
            ],
        ])->assertOk()
            ->assertJsonMissingPath('settings.enable_sms_notifications');

        $this->assertDatabaseHas('settings', [
            'key' => 'school_start_time',
            'value' => '07:30',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'late_threshold',
            'value' => '07:45',
        ]);
        $this->assertDatabaseHas('settings', [
            'key' => 'school_end_time',
            'value' => '16:30',
        ]);

        $this->getJson('/api/principal/settings')
            ->assertOk()
            ->assertJsonPath('school_start_time', '07:30')
            ->assertJsonPath('late_threshold', '07:45')
            ->assertJsonPath('school_end_time', '16:30')
            ->assertJsonMissingPath('enable_sms_notifications')
            ->assertJsonMissingPath('phone_number');
    }

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create();
        Role::findOrCreate('admin', 'web');
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);

        return $admin;
    }

    private function actingAsPrincipal(): User
    {
        $principal = User::factory()->create();
        Role::findOrCreate('principal', 'web');
        $principal->assignRole('principal');
        Sanctum::actingAs($principal);

        return $principal;
    }
}
