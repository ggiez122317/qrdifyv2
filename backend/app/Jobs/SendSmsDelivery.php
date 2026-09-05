<?php

namespace App\Jobs;

use App\Contracts\SmsGateway;
use App\Exceptions\SmsGatewayException;
use App\Models\SmsDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Throwable;

class SendSmsDelivery implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly int $deliveryId,
    ) {
        $this->onQueue((string) config('sms.queue', 'sms'));
    }

    public function backoff(): array
    {
        return [10, 30, 60];
    }

    public function middleware(): array
    {
        return [
            (new WithoutOverlapping('huawei-router-sms'))
                ->shared()
                ->releaseAfter(5)
                ->expireAfter(120),
        ];
    }

    public function handle(SmsGateway $gateway): void
    {
        $delivery = SmsDelivery::find($this->deliveryId);

        if ($delivery === null || $delivery->status === 'accepted') {
            return;
        }

        $delivery->forceFill([
            'status' => 'sending',
            'attempts' => $delivery->attempts + 1,
            'last_error' => null,
            'failed_at' => null,
        ])->save();

        try {
            if ($delivery->provider !== config('sms.provider')) {
                throw new SmsGatewayException('SMS provider changed. Review this delivery before retrying with a different provider.');
            }

            $result = $gateway->send($delivery->recipient, $delivery->message);

            $delivery->forceFill([
                'provider' => $result->provider,
                'provider_response' => $result->response,
                'status' => 'accepted',
                'accepted_at' => now(),
                'last_error' => null,
            ])->save();
        } catch (Throwable $exception) {
            $isFinalAttempt = $this->attempts() >= $this->tries;

            $delivery->forceFill([
                'status' => $isFinalAttempt ? 'failed' : 'queued',
                'provider_response' => $exception instanceof SmsGatewayException
                    ? $exception->providerResponse
                    : $delivery->provider_response,
                'last_error' => $exception->getMessage(),
                'failed_at' => $isFinalAttempt ? now() : null,
            ])->save();

            throw $exception;
        }
    }

    public function failed(Throwable $exception): void
    {
        SmsDelivery::whereKey($this->deliveryId)->update([
            'status' => 'failed',
            'last_error' => $exception->getMessage(),
            'failed_at' => now(),
        ]);
    }
}
