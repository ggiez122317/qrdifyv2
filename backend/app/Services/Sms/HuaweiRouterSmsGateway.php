<?php

namespace App\Services\Sms;

use App\Contracts\SmsGateway;
use App\Data\SmsSendResult;
use App\Exceptions\SmsGatewayException;
use Closure;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class HuaweiRouterSmsGateway implements SmsGateway
{
    public function __construct(
        private readonly ?Closure $nonceFactory = null,
    ) {}

    public function send(string $recipient, string $message): SmsSendResult
    {
        $url = rtrim((string) config('sms.providers.huawei_router.url'), '/');
        $username = (string) config('sms.providers.huawei_router.username');
        $password = (string) config('sms.providers.huawei_router.password');

        if ($url === '' || $username === '' || $password === '') {
            throw new SmsGatewayException('Huawei router SMS credentials are not configured.');
        }

        ['session' => $session, 'token' => $token] = $this->getSessionAndToken($url);
        $challenge = $this->challengeLogin($url, $username, $session, $token);
        $authenticated = $this->authenticate($url, $password, $challenge);
        $response = $this->sendMessage(
            $url,
            $authenticated['session'],
            $authenticated['token'],
            $recipient,
            $message,
        );

        return new SmsSendResult('huawei_router', $response);
    }

    private function getSessionAndToken(string $url): array
    {
        $response = $this->request()->get("{$url}/api/webserver/SesTokInfo");
        $this->ensureHttpSuccess($response, 'Unable to obtain a Huawei router session.');

        $session = $this->xmlValue($response->body(), 'SesInfo');
        $token = $this->xmlValue($response->body(), 'TokInfo');

        if ($session === null || $token === null) {
            throw new SmsGatewayException(
                'Huawei router did not return a session and verification token.',
                $this->safeResponse($response->body()),
            );
        }

        return compact('session', 'token');
    }

    private function challengeLogin(string $url, string $username, string $session, string $token): array
    {
        $firstNonce = $this->generateNonce();
        $body = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<request>'
            .'<username>'.$this->xmlEscape($username).'</username>'
            .'<firstnonce>'.$firstNonce.'</firstnonce>'
            .'<mode>1</mode>'
            .'</request>';

        $response = $this->authenticatedRequest($session, $token)
            ->withBody($body, 'application/x-www-form-urlencoded; charset=UTF-8')
            ->post("{$url}/api/user/challenge_login");

        $this->ensureHttpSuccess($response, 'Huawei router challenge login failed.');

        $salt = $this->xmlValue($response->body(), 'salt');
        $serverNonce = $this->xmlValue($response->body(), 'servernonce');
        $iterations = (int) ($this->xmlValue($response->body(), 'iterations') ?? 0);

        if ($salt === null || $serverNonce === null || $iterations < 1) {
            throw new SmsGatewayException(
                'Huawei router returned an invalid login challenge.',
                $this->safeResponse($response->body()),
            );
        }

        return [
            'first_nonce' => $firstNonce,
            'salt' => $salt,
            'server_nonce' => $serverNonce,
            'iterations' => $iterations,
            'session' => $this->sessionFromResponse($response, $session),
            'token' => $this->tokensFromResponse($response)[0] ?? $token,
        ];
    }

    private function authenticate(string $url, string $password, array $challenge): array
    {
        $proof = $this->calculateClientProof(
            $password,
            $challenge['salt'],
            $challenge['iterations'],
            $challenge['first_nonce'],
            $challenge['server_nonce'],
        );

        $body = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<request>'
            .'<clientproof>'.$proof.'</clientproof>'
            .'<finalnonce>'.$this->xmlEscape($challenge['server_nonce']).'</finalnonce>'
            .'</request>';

        $response = $this->authenticatedRequest($challenge['session'], $challenge['token'])
            ->withBody($body, 'application/x-www-form-urlencoded; charset=UTF-8')
            ->post("{$url}/api/user/authentication_login");

        $this->ensureHttpSuccess($response, 'Huawei router authentication failed.');

        if (! preg_match('/<response(?:\s[^>]*)?>/i', $response->body())) {
            throw new SmsGatewayException(
                'Huawei router rejected the authentication proof.',
                $this->safeResponse($response->body()),
            );
        }

        return [
            'session' => $this->sessionFromResponse($response, $challenge['session']),
            'token' => $this->tokensFromResponse($response)[0] ?? $challenge['token'],
        ];
    }

    private function sendMessage(
        string $url,
        string $session,
        string $token,
        string $recipient,
        string $message,
    ): string {
        $body = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<request>'
            .'<Index>-1</Index>'
            .'<Phones><Phone>'.$this->xmlEscape($recipient).'</Phone></Phones>'
            .'<Sca></Sca>'
            .'<Content>'.$this->xmlEscape($message).'</Content>'
            .'<Length>'.mb_strlen($message).'</Length>'
            .'<Reserved>1</Reserved>'
            .'<Date>'.now()->format('Y-m-d H:i:s').'</Date>'
            .'</request>';

        $response = $this->authenticatedRequest($session, $token)
            ->withBody($body, 'text/xml; charset=UTF-8')
            ->post("{$url}/api/sms/send-sms");

        $this->ensureHttpSuccess($response, 'Huawei router SMS request failed.');

        if (! preg_match('/<response>\s*OK\s*<\/response>/i', $response->body())) {
            throw new SmsGatewayException(
                'Huawei router did not accept the SMS.',
                $this->safeResponse($response->body()),
            );
        }

        return $this->safeResponse($response->body());
    }

    private function calculateClientProof(
        string $password,
        string $salt,
        int $iterations,
        string $firstNonce,
        string $serverNonce,
    ): string {
        $saltBytes = hex2bin($salt);

        if ($saltBytes === false) {
            throw new SmsGatewayException('Huawei router returned an invalid authentication salt.');
        }

        $saltedPassword = hash_pbkdf2('sha256', $password, $saltBytes, $iterations, 32, true);
        $clientKey = hash_hmac('sha256', $saltedPassword, 'Client Key', true);
        $storedKey = hash('sha256', $clientKey, true);
        $authenticationMessage = "{$firstNonce},{$serverNonce},{$serverNonce}";
        $signature = hash_hmac('sha256', $storedKey, $authenticationMessage, true);

        return bin2hex($clientKey ^ $signature);
    }

    private function request(): PendingRequest
    {
        return Http::connectTimeout((int) config('sms.providers.huawei_router.connect_timeout', 3))
            ->timeout((int) config('sms.providers.huawei_router.timeout', 10))
            ->accept('*/*');
    }

    private function authenticatedRequest(string $session, string $token): PendingRequest
    {
        return $this->request()->withHeaders([
            'Cookie' => "SessionID={$session}",
            '__RequestVerificationToken' => $token,
            'X-Requested-With' => 'XMLHttpRequest',
            'Connection' => 'close',
        ]);
    }

    private function ensureHttpSuccess(Response $response, string $message): void
    {
        if (! $response->successful()) {
            throw new SmsGatewayException(
                "{$message} HTTP {$response->status()}.",
                $this->safeResponse($response->body()),
            );
        }
    }

    private function xmlValue(string $xml, string $tag): ?string
    {
        if (! preg_match('/<'.preg_quote($tag, '/').'(?:\s[^>]*)?>(.*?)<\/'.preg_quote($tag, '/').'>/is', $xml, $matches)) {
            return null;
        }

        return html_entity_decode(trim($matches[1]), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function xmlEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function tokensFromResponse(Response $response): array
    {
        $raw = $response->header('__RequestVerificationToken')
            ?? $response->header('__requestverificationtoken');

        if ($raw === null || $raw === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode('#', $raw))));
    }

    private function sessionFromResponse(Response $response, string $fallback): string
    {
        $cookie = $response->header('Set-Cookie');

        if ($cookie !== null && preg_match('/SessionID=([^;]+)/i', $cookie, $matches)) {
            return $matches[1];
        }

        return $fallback;
    }

    private function generateNonce(): string
    {
        return $this->nonceFactory !== null
            ? ($this->nonceFactory)()
            : bin2hex(random_bytes(32));
    }

    private function safeResponse(string $response): string
    {
        return Str::limit(trim($response), 5000, '');
    }
}
