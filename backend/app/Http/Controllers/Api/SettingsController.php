<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\SendSmsDelivery;
use App\Models\Setting;
use App\Models\SmsDelivery;
use App\Services\SettingsService;
use App\Services\Sms\PhoneNumberNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
        private readonly PhoneNumberNormalizer $phoneNumbers,
    ) {}

    /**
     * Get all settings as a key-value array.
     * Uses the cached SettingsService for extreme performance.
     */
    public function index(): JsonResponse
    {
        return response()->json($this->settings->all());
    }

    /**
     * Update settings and invalidate the cache.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->settings as $key => $value) {
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value],
                );
            }
            DB::commit();

            // Clear cache so the next read fetches fresh settings
            $this->settings->clearCache();

            return response()->json(['message' => 'Settings updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to update settings', 'error' => $e->getMessage()], 500);
        }
    }

    public function testSms(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:32'],
        ]);
        $recipient = $this->phoneNumbers->normalizePhilippineMobile($validated['phone_number']);

        if ($recipient === null) {
            throw ValidationException::withMessages([
                'phone_number' => 'Enter a valid Philippine mobile number.',
            ]);
        }

        $user = $request->user();
        $schoolName = (string) config('sms.school_name', 'School');
        $message = "[{$schoolName}] Test SMS requested by {$user->name} at ".now()->format('h:i A').'. The SMS integration is working.';
        $delivery = SmsDelivery::create([
            'user_id' => $user->id,
            'attendance_log_id' => null,
            'deduplication_key' => hash('sha256', $user->id.'|test|'.Str::uuid()),
            'recipient' => $recipient,
            'event_type' => 'test',
            'message' => $message,
            'provider' => (string) config('sms.provider', 'huawei_router'),
            'status' => 'queued',
        ]);

        SendSmsDelivery::dispatch($delivery->id)->afterCommit();

        return response()->json([
            'message' => "Test SMS queued for {$recipient}.",
            'delivery_id' => $delivery->id,
            'recipient' => $recipient,
        ], 202);
    }
}
