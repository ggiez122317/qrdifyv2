<?php

namespace Tests\Feature\Sms;

use App\Contracts\SmsGateway;
use App\Exceptions\SmsGatewayException;
use App\Services\Sms\HttpSmsGateway;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HttpSmsGatewayTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('sms.provider', 'httpsms');
        config()->set('sms.providers.httpsms', [
            'api_key' => 'test-api-key',
            'from_number' => '+639000000001',
            'connect_timeout' => 3,
            'timeout' => 10,
        ]);
        Http::preventStrayRequests();
    }

    public function test_it_sends_the_authenticated_payload_and_keeps_a_minimal_receipt(): void
    {
        Http::fake(['api.httpsms.com/*' => Http::response([
            'status' => 'success',
            'data' => ['id' => 'test-message-id', 'status' => 'pending', 'content' => 'Private text'],
        ])]);
        $this->app->forgetInstance(SmsGateway::class);
        $gateway = app(SmsGateway::class);
        $this->assertInstanceOf(HttpSmsGateway::class, $gateway);
        $result = $gateway->send('+639000000002', 'Private text');

        Http::assertSent(fn ($request) => $request->url() === 'https://api.httpsms.com/v1/messages/send'
            && $request->method() === 'POST'
            && $request->hasHeader('x-api-key', 'test-api-key')
            && $request['from'] === '+639000000001'
            && $request['to'] === '+639000000002'
            && $request['content'] === 'Private text');
        Http::assertSentCount(1);
        $this->assertSame('httpsms', $result->provider);
        $receipt = json_decode($result->response, true);
        $this->assertTrue($receipt['accepted']);
        $this->assertSame('pending', $receipt['status']);
        $this->assertSame('test-message-id', $receipt['message_id']);
        $this->assertStringNotContainsString('Private text', $result->response);
        $this->assertStringNotContainsString('test-api-key', $result->response);
    }

    public function test_it_rejects_missing_credentials_before_any_http_request(): void
    {
        Http::fake();
        foreach (['api_key', 'from_number'] as $key) {
            $previous = config('sms.providers.httpsms.'.$key);
            config()->set('sms.providers.httpsms.'.$key, '');
            try {
                (new HttpSmsGateway)->send('+639000000002', 'Test');
                $this->fail('Missing credentials must prevent sending.');
            } catch (SmsGatewayException $exception) {
                $this->assertStringContainsString('requires an API key', $exception->getMessage());
            }
            config()->set('sms.providers.httpsms.'.$key, $previous);
        }
        Http::assertNothingSent();
    }

    public function test_rejections_and_malformed_success_responses_are_not_marked_accepted(): void
    {
        $cases = [
            [401, ['message' => 'private-test-api-key']],
            [422, ['message' => 'private-recipient']],
            [429, ['status' => 'error']],
            [500, ['status' => 'error']],
            [200, ['status' => 'success']],
            [200, ['status' => 'error', 'data' => ['id' => 'id']]],
            [200, ['status' => 'success', 'data' => ['id' => 'id', 'status' => 'failed']]],
            [200, '<html>not json</html>'],
        ];
        $sequence = Http::fakeSequence();
        foreach ($cases as [$status, $body]) {
            $sequence->push($body, $status);
        }
        foreach ($cases as [$status]) {
            try {
                (new HttpSmsGateway)->send('+639000000002', 'Test');
                $this->fail('Unconfirmed acceptance must fail.');
            } catch (SmsGatewayException $exception) {
                $this->assertStringContainsString('HTTP '.$status, $exception->getMessage());
                $this->assertFalse(json_decode($exception->providerResponse, true)['accepted']);
                $this->assertStringNotContainsString('private-', $exception->providerResponse);
            }
        }
    }

    public function test_connection_failure_has_no_internal_retry_or_sensitive_exception_details(): void
    {
        Http::fake(['api.httpsms.com/*' => Http::failedConnection('private transport detail')]);
        try {
            (new HttpSmsGateway)->send('+639000000002', 'Test');
            $this->fail('Connection failure must throw.');
        } catch (SmsGatewayException $exception) {
            $this->assertStringContainsString('acceptance is unknown', $exception->getMessage());
            $this->assertNull($exception->getPrevious());
            $this->assertNull($exception->providerResponse);
        }
    }
}
