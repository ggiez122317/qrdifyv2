<?php

namespace App\Services\Sms;

use App\Contracts\SmsGateway;
use App\Data\SmsSendResult;
use App\Exceptions\SmsGatewayException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

final class HttpSmsGateway implements SmsGateway
{
    public function send(string $recipient, string $message): SmsSendResult
    {
        $key = trim((string) config('sms.providers.httpsms.api_key'));
        $from = trim((string) config('sms.providers.httpsms.from_number'));

        if ($key === '' || ! preg_match('/^\+[1-9][0-9]{7,14}$/', $from)) {
            throw new SmsGatewayException('httpSMS requires an API key and a sender number in international +country-code format.');
        }

        try {
            // Do not automatically retry here: an ambiguous timeout may have queued a message.
            $response = Http::withHeaders(['x-api-key' => $key])
                ->acceptJson()
                ->asJson()
                ->withOptions(['allow_redirects' => false])
                ->connectTimeout((int) config('sms.providers.httpsms.connect_timeout', 3))
                ->timeout((int) config('sms.providers.httpsms.timeout', 10))
                ->post('https://api.httpsms.com/v1/messages/send', [
                    'from' => $from,
                    'to' => $recipient,
                    'content' => $message,
                ]);
        } catch (ConnectionException) {
            // Never persist request headers, numbers or content from a transport exception.
            throw new SmsGatewayException('httpSMS connection failed or timed out; acceptance is unknown.');
        }

        $id = $response->json('data.id');
        $status = $response->json('status');
        $deliveryStatus = $response->json('data.status');
        $accepted = $response->successful()
            && $status === 'success'
            && is_string($id) && $id !== ''
            && ! in_array($deliveryStatus, ['failed', 'expired'], true);

        // Keep a small audit receipt, excluding echoed message content, numbers and secrets.
        $receipt = json_encode([
            'http_status' => $response->status(),
            'accepted' => $accepted,
            'message_id' => is_string($id) ? substr($id, 0, 128) : null,
            'status' => is_string($deliveryStatus) ? substr($deliveryStatus, 0, 40) : null,
        ], JSON_THROW_ON_ERROR);

        if (! $accepted) {
            throw new SmsGatewayException(
                'httpSMS did not confirm message acceptance (HTTP '.$response->status().').',
                $receipt,
            );
        }

        return new SmsSendResult('httpsms', $receipt);
    }
}
