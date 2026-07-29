<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendParentSmsNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(
        protected string $to,
        protected string $message
    ) {}

    public function handle(): void
    {
        $apiKey = config('services.httpsms.key');
        $from   = config('services.httpsms.from');

        if (empty($apiKey) || empty($from)) {
            Log::warning('SendParentSmsNotification: httpSMS credentials not configured.');
            return;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => $apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.httpsms.com/v1/messages/send', [
                'content' => $this->message,
                'from'    => $from,
                'to'      => $this->to,
            ]);

            if (!$response->successful()) {
                Log::error('SendParentSmsNotification: Failed to send SMS.', [
                    'to'       => $this->to,
                    'status'   => $response->status(),
                    'response' => $response->body(),
                ]);
            }
        } catch (\Exception $e) {
            Log::error('SendParentSmsNotification: Exception occurred.', [
                'to'      => $this->to,
                'message' => $e->getMessage(),
            ]);
        }
    }
}
