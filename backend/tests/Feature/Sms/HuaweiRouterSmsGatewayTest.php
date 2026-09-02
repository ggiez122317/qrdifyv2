<?php

namespace Tests\Feature\Sms;

use App\Exceptions\SmsGatewayException;
use App\Services\Sms\HuaweiRouterSmsGateway;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HuaweiRouterSmsGatewayTest extends TestCase
{
    private const FIRST_NONCE = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    private const SERVER_NONCE = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('sms.providers.huawei_router', [
            'url' => 'http://192.168.8.1',
            'username' => 'admin',
            'password' => 'router-secret',
            'connect_timeout' => 1,
            'timeout' => 2,
        ]);
    }

    public function test_it_authenticates_and_sends_xml_to_the_router(): void
    {
        Http::fakeSequence()
            ->push(
                '<response><SesInfo>session-1</SesInfo><TokInfo>token-1</TokInfo></response>',
            )
            ->push(
                '<response><salt>00112233445566778899aabbccddeeff</salt>'
                .'<servernonce>'.self::SERVER_NONCE.'</servernonce><iterations>1000</iterations></response>',
                200,
                [
                    '__RequestVerificationToken' => 'token-2#token-unused',
                    'Set-Cookie' => 'SessionID=session-2; Path=/',
                ],
            )
            ->push('<response>OK</response>', 200, [
                '__RequestVerificationToken' => 'token-3',
                'Set-Cookie' => 'SessionID=session-3; Path=/',
            ])
            ->push('<response>OK</response>');

        $gateway = new HuaweiRouterSmsGateway(fn () => self::FIRST_NONCE);
        $message = 'Parent <alert> & "safe"';

        $result = $gateway->send('+639171234567', $message);

        $this->assertSame('huawei_router', $result->provider);
        $this->assertSame('<response>OK</response>', $result->response);

        $requests = Http::recorded()->map(fn (array $pair) => $pair[0])->values();
        $this->assertCount(4, $requests);
        $this->assertSame('http://192.168.8.1/api/webserver/SesTokInfo', $requests[0]->url());
        $this->assertStringContainsString('<firstnonce>'.self::FIRST_NONCE.'</firstnonce>', $requests[1]->body());
        $this->assertStringContainsString(
            '<clientproof>37266d8a8d09a4356e7183369524539ca92191d161d4354c0d86b8278493f4b7</clientproof>',
            $requests[2]->body(),
        );
        $this->assertSame(['SessionID=session-3'], $requests[3]->header('Cookie'));
        $this->assertSame(['token-3'], $requests[3]->header('__RequestVerificationToken'));
        $this->assertStringContainsString('<Phone>+639171234567</Phone>', $requests[3]->body());
        $this->assertStringContainsString(
            '<Content>Parent &lt;alert&gt; &amp; &quot;safe&quot;</Content>',
            $requests[3]->body(),
        );
        $this->assertStringContainsString('<Length>'.mb_strlen($message).'</Length>', $requests[3]->body());
    }

    public function test_it_throws_when_the_router_does_not_accept_the_sms(): void
    {
        Http::fakeSequence()
            ->push('<response><SesInfo>session</SesInfo><TokInfo>token</TokInfo></response>')
            ->push(
                '<response><salt>00112233445566778899aabbccddeeff</salt>'
                .'<servernonce>'.self::SERVER_NONCE.'</servernonce><iterations>1000</iterations></response>',
            )
            ->push('<response>OK</response>')
            ->push('<error><code>115002</code></error>');

        $gateway = new HuaweiRouterSmsGateway(fn () => self::FIRST_NONCE);

        try {
            $gateway->send('+639171234567', 'Test message');
            $this->fail('Expected the router rejection to throw.');
        } catch (SmsGatewayException $exception) {
            $this->assertSame('Huawei router did not accept the SMS.', $exception->getMessage());
            $this->assertSame('<error><code>115002</code></error>', $exception->providerResponse);
        }
    }

    public function test_it_does_not_make_a_request_without_credentials(): void
    {
        config()->set('sms.providers.huawei_router.password', null);
        Http::fake();

        $this->expectException(SmsGatewayException::class);
        $this->expectExceptionMessage('credentials are not configured');

        (new HuaweiRouterSmsGateway)->send('+639171234567', 'Test message');

        Http::assertNothingSent();
    }
}
