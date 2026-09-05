<?php

namespace Tests\Feature\Sms;

use App\Contracts\SmsGateway;
use App\Data\SmsSendResult;
use App\Exceptions\SmsGatewayException;
use App\Jobs\SendSmsDelivery;
use App\Models\AttendanceLog;
use App\Models\SmsDelivery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SendSmsDeliveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('sms.provider', 'huawei_router');
    }

    public function test_a_provider_switch_cannot_send_old_deliveries_through_the_new_provider(): void
    {
        config()->set('sms.provider', 'httpsms');
        foreach (['huawei_router', 'simulated'] as $provider) {
            $delivery = $this->makeDelivery(['provider' => $provider]);
            $gateway = $this->mock(SmsGateway::class);
            $gateway->shouldNotReceive('send');
            try {
                (new SendSmsDelivery($delivery->id))->handle($gateway);
                $this->fail('Provider changes must prevent sending.');
            } catch (SmsGatewayException $exception) {
                $this->assertStringContainsString('provider changed', $exception->getMessage());
            }
            $this->assertSame($provider, $delivery->fresh()->provider);
            $this->assertNull($delivery->fresh()->accepted_at);
        }
    }

    public function test_it_records_an_httpsms_api_acceptance(): void
    {
        config()->set('sms.provider', 'httpsms');
        $delivery = $this->makeDelivery(['provider' => 'httpsms']);
        $gateway = $this->mock(SmsGateway::class);
        $gateway->shouldReceive('send')->once()->andReturn(new SmsSendResult('httpsms', '{"status":"pending"}'));
        (new SendSmsDelivery($delivery->id))->handle($gateway);
        $this->assertSame('accepted', $delivery->fresh()->status);
        $this->assertSame('httpsms', $delivery->fresh()->provider);
        $this->assertNotNull($delivery->fresh()->accepted_at);
    }

    public function test_it_records_a_router_accepted_delivery(): void
    {
        $delivery = $this->makeDelivery();
        $gateway = new class implements SmsGateway
        {
            public function send(string $recipient, string $message): SmsSendResult
            {
                return new SmsSendResult('huawei_router', '<response>OK</response>');
            }
        };

        (new SendSmsDelivery($delivery->id))->handle($gateway);

        $delivery->refresh();
        $this->assertSame('accepted', $delivery->status);
        $this->assertSame(1, $delivery->attempts);
        $this->assertSame('<response>OK</response>', $delivery->provider_response);
        $this->assertNotNull($delivery->accepted_at);
        $this->assertNull($delivery->last_error);
    }

    public function test_it_records_an_error_and_rethrows_for_queue_retry(): void
    {
        $delivery = $this->makeDelivery();
        $gateway = new class implements SmsGateway
        {
            public function send(string $recipient, string $message): SmsSendResult
            {
                throw new SmsGatewayException(
                    'Router unavailable.',
                    '<error><code>100003</code></error>',
                );
            }
        };

        try {
            (new SendSmsDelivery($delivery->id))->handle($gateway);
            $this->fail('Expected the gateway error to be rethrown.');
        } catch (SmsGatewayException $exception) {
            $this->assertSame('Router unavailable.', $exception->getMessage());
        }

        $delivery->refresh();
        $this->assertSame('queued', $delivery->status);
        $this->assertSame(1, $delivery->attempts);
        $this->assertSame('Router unavailable.', $delivery->last_error);
        $this->assertSame('<error><code>100003</code></error>', $delivery->provider_response);
        $this->assertNull($delivery->accepted_at);
    }

    public function test_it_does_not_send_an_already_accepted_delivery_again(): void
    {
        $delivery = $this->makeDelivery(['status' => 'accepted', 'accepted_at' => now()]);
        $gateway = new class implements SmsGateway
        {
            public function send(string $recipient, string $message): SmsSendResult
            {
                throw new \RuntimeException('The gateway should not be called.');
            }
        };

        (new SendSmsDelivery($delivery->id))->handle($gateway);

        $this->assertSame(0, $delivery->fresh()->attempts);
    }

    private function makeDelivery(array $overrides = []): SmsDelivery
    {
        $user = User::factory()->create();
        $log = AttendanceLog::create([
            'user_id' => $user->id,
            'type' => 'in',
            'scanned_at' => now(),
        ]);

        return SmsDelivery::create(array_merge([
            'user_id' => $user->id,
            'attendance_log_id' => $log->id,
            'deduplication_key' => hash('sha256', "{$log->id}|+639171234567|in"),
            'recipient' => '+639171234567',
            'event_type' => 'in',
            'message' => '[School] Your child entered the school.',
            'provider' => 'huawei_router',
            'status' => 'queued',
        ], $overrides));
    }
}
