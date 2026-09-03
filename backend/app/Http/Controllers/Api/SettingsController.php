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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    private const PRINCIPAL_SETTING_KEYS = [
        'school_start_time',
        'late_threshold',
        'school_end_time',
    ];

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

    public function indexPrincipal(): JsonResponse
    {
        return response()->json($this->onlySettings(self::PRINCIPAL_SETTING_KEYS));
    }

    /**
     * Update settings and invalidate the cache.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array:school_start_time,late_threshold,school_end_time,enable_sms_notifications,scan_deduplication_seconds,enable_push_notifications,enable_email_notifications,notify_check_in,notify_check_out,notify_late,notify_early,compact_tables,principal_name,principal_position,principal_signature,school_year,timezone,date_format,default_theme,phone_number',
            'settings.school_start_time' => 'sometimes|date_format:H:i',
            'settings.late_threshold' => 'sometimes|date_format:H:i',
            'settings.school_end_time' => 'sometimes|date_format:H:i',
            'settings.enable_sms_notifications' => 'sometimes|boolean',
            'settings.scan_deduplication_seconds' => 'sometimes|integer|min:0|max:3600',
            'settings.enable_push_notifications' => 'sometimes|boolean',
            'settings.enable_email_notifications' => 'sometimes|boolean',
            'settings.notify_check_in' => 'sometimes|boolean',
            'settings.notify_check_out' => 'sometimes|boolean',
            'settings.notify_late' => 'sometimes|boolean',
            'settings.notify_early' => 'sometimes|boolean',
            'settings.compact_tables' => 'sometimes|boolean',
            'settings.principal_name' => 'sometimes|string|max:120',
            'settings.principal_position' => 'sometimes|string|max:120',
            'settings.principal_signature' => 'sometimes|nullable|string|max:3000000',
            'settings.school_year' => ['sometimes', 'string', 'max:20', 'regex:/^\d{4}-\d{4}$/'],
            'settings.timezone' => 'sometimes|timezone:all',
            'settings.date_format' => 'sometimes|in:MM/DD/YYYY,DD/MM/YYYY,YYYY-MM-DD',
            'settings.default_theme' => 'sometimes|in:light,dark,system',
            'settings.phone_number' => 'sometimes|nullable|string|max:30',
        ]);

        return $this->persistSettings($validated['settings']);
    }

    public function updatePrincipal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array:school_start_time,late_threshold,school_end_time',
            'settings.school_start_time' => 'sometimes|date_format:H:i',
            'settings.late_threshold' => 'sometimes|date_format:H:i',
            'settings.school_end_time' => 'sometimes|date_format:H:i',
        ]);

        return $this->persistSettings($validated['settings'], self::PRINCIPAL_SETTING_KEYS);
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

    private function persistSettings(array $allowedSettings, ?array $responseKeys = null): JsonResponse
    {
        DB::beginTransaction();
        try {
            if (array_key_exists('principal_signature', $allowedSettings)) {
                $allowedSettings['principal_signature'] = $this->storePrincipalSignature(
                    $allowedSettings['principal_signature']
                );
            }

            foreach ($allowedSettings as $key => $value) {
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                }

                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value, 'type' => $this->settingType($value)]
                );
            }
            DB::commit();

            // Clear cache so the next read fetches fresh settings
            $this->settings->clearCache();

            $savedSettings = $responseKeys === null
                ? $this->settings->all()
                : $this->onlySettings($responseKeys);

            return response()->json([
                'message' => 'Settings updated successfully',
                'settings' => $savedSettings,
            ]);
        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update settings', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Return the student ID base templates used by the ID renderer.
     */
    public function idTemplates(): JsonResponse
    {
        return response()->json([
            'mode' => $this->settings->get('student_id_template_mode', 'default'),
            'front_template' => $this->settings->get('student_id_front_template', ''),
            'back_template' => $this->settings->get('student_id_back_template', ''),
        ]);
    }

    /**
     * Upload one or both background-only student ID templates.
     */
    public function updateIdTemplates(Request $request): JsonResponse
    {
        if (!$request->hasFile('front_template') && !$request->hasFile('back_template')) {
            throw ValidationException::withMessages([
                'templates' => 'Choose a front or back template to upload.',
            ]);
        }

        $validated = $request->validate([
            'front_template' => 'sometimes|file|image|mimes:png,jpg,jpeg,webp|max:5120|dimensions:min_width=260,min_height=414',
            'back_template' => 'sometimes|file|image|mimes:png,jpg,jpeg,webp|max:5120|dimensions:min_width=260,min_height=414',
        ]);

        $updated = [];
        foreach (['front_template' => 'student_id_front_template', 'back_template' => 'student_id_back_template'] as $field => $key) {
            if (!isset($validated[$field])) {
                continue;
            }

            $updated[$field] = $this->replaceIdTemplate($key, $field, $validated[$field]);
        }

        $this->settings->clearCache();

        return response()->json([
            'message' => 'ID templates updated successfully.',
            'templates' => array_merge([
                'mode' => $this->settings->get('student_id_template_mode', 'default'),
                'front_template' => $this->settings->get('student_id_front_template', ''),
                'back_template' => $this->settings->get('student_id_back_template', ''),
            ], $updated),
        ]);
    }

    /**
     * Choose whether student IDs use the built-in design or uploaded templates.
     */
    public function updateIdTemplateMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mode' => 'required|in:default,custom',
        ]);

        if ($validated['mode'] === 'custom') {
            $hasCustomTemplate = $this->settings->get('student_id_front_template', '')
                || $this->settings->get('student_id_back_template', '');

            if (!$hasCustomTemplate) {
                throw ValidationException::withMessages([
                    'mode' => 'Upload at least one custom template before activating custom mode.',
                ]);
            }
        }

        Setting::updateOrCreate(
            ['key' => 'student_id_template_mode'],
            ['value' => $validated['mode'], 'type' => 'string']
        );
        $this->settings->clearCache();

        return response()->json([
            'message' => $validated['mode'] === 'custom'
                ? 'Custom ID templates are now active.'
                : 'The current built-in ID design is now active.',
            'templates' => [
                'mode' => $validated['mode'],
                'front_template' => $this->settings->get('student_id_front_template', ''),
                'back_template' => $this->settings->get('student_id_back_template', ''),
            ],
        ]);
    }

    /**
     * Remove one custom template and restore the built-in design for that side.
     */
    public function destroyIdTemplate(string $side): JsonResponse
    {
        $key = match ($side) {
            'front' => 'student_id_front_template',
            'back' => 'student_id_back_template',
            default => null,
        };

        if (!$key) {
            return response()->json(['message' => 'Template side must be front or back.'], 422);
        }

        $current = (string) $this->settings->get($key, '');
        $this->deleteStoredIdTemplate($current);
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => '', 'type' => 'image']
        );
        $this->settings->clearCache();

        $frontTemplate = (string) $this->settings->get('student_id_front_template', '');
        $backTemplate = (string) $this->settings->get('student_id_back_template', '');
        if (!$frontTemplate && !$backTemplate) {
            Setting::updateOrCreate(
                ['key' => 'student_id_template_mode'],
                ['value' => 'default', 'type' => 'string']
            );
            $this->settings->clearCache();
        }

        return response()->json([
            'message' => ucfirst($side).' template removed. The built-in design is active again.',
            'templates' => [
                'mode' => $this->settings->get('student_id_template_mode', 'default'),
                'front_template' => $frontTemplate,
                'back_template' => $backTemplate,
            ],
        ]);
    }

    private function replaceIdTemplate(string $key, string $side, mixed $file): string
    {
        $previous = (string) $this->settings->get($key, '');
        $extension = strtolower((string) $file->extension());
        $extension = $extension === 'jpeg' ? 'jpg' : $extension;
        $filename = 'student-'.str_replace('_template', '', $side).'-'.Str::uuid().'.'.$extension;
        $path = $file->storeAs('settings/id-templates', $filename, 'public');
        $storedPath = '/storage/'.$path;

        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $storedPath, 'type' => 'image']
        );
        $this->deleteStoredIdTemplate($previous);

        return $storedPath;
    }

    private function deleteStoredIdTemplate(string $path): void
    {
        if (!str_starts_with($path, '/storage/settings/id-templates/')) {
            return;
        }

        Storage::disk('public')->delete(str_replace('/storage/', '', $path));
    }

    private function onlySettings(array $keys): array
    {
        return array_intersect_key($this->settings->all(), array_flip($keys));
    }

    private function storePrincipalSignature(?string $signature): string
    {
        if (!$signature) {
            return '';
        }

        if (str_starts_with($signature, '/storage/settings/')) {
            $existingPath = str_replace('/storage/', '', $signature);
            if (Storage::disk('public')->exists($existingPath)) {
                $extension = strtolower(pathinfo($existingPath, PATHINFO_EXTENSION));
                $cropped = $this->cropSignatureWhitespace(
                    Storage::disk('public')->get($existingPath),
                    $extension
                );
                $croppedPath = 'settings/principal-signature-cropped-'.now()->timestamp.'.'.$extension;
                Storage::disk('public')->put($croppedPath, $cropped);
                return '/storage/'.$croppedPath;
            }
            return $signature;
        }

        if (!str_starts_with($signature, 'data:image/')) {
            return $signature;
        }

        if (!preg_match('/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/s', $signature, $matches)) {
            throw ValidationException::withMessages([
                'settings.principal_signature' => 'The principal signature must be a PNG, JPG, or WEBP image.',
            ]);
        }

        $contents = base64_decode($matches[2], true);
        if ($contents === false || strlen($contents) > 2 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'settings.principal_signature' => 'The principal signature image must not exceed 2 MB.',
            ]);
        }

        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $path = 'settings/principal-signature-'.now()->timestamp.'.'.$extension;
        Storage::disk('public')->put($path, $this->cropSignatureWhitespace($contents, $extension));

        return '/storage/'.$path;
    }

    private function cropSignatureWhitespace(string $contents, string $extension): string
    {
        $image = @imagecreatefromstring($contents);
        if (!$image) return $contents;

        $width = imagesx($image);
        $height = imagesy($image);
        $left = $width;
        $right = 0;
        $top = $height;
        $bottom = 0;

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                $color = imagecolorat($image, $x, $y);
                $alpha = ($color >> 24) & 0x7F;
                $red = ($color >> 16) & 0xFF;
                $green = ($color >> 8) & 0xFF;
                $blue = $color & 0xFF;
                $isVisibleInk = $alpha < 120 && min($red, $green, $blue) < 235;
                if ($isVisibleInk) {
                    $left = min($left, $x);
                    $right = max($right, $x);
                    $top = min($top, $y);
                    $bottom = max($bottom, $y);
                }
            }
        }

        if ($right <= $left || $bottom <= $top) {
            imagedestroy($image);
            return $contents;
        }

        $padding = 10;
        $sourceX = max(0, $left - $padding);
        $sourceY = max(0, $top - $padding);
        $cropWidth = min($width - $sourceX, $right - $left + ($padding * 2));
        $cropHeight = min($height - $sourceY, $bottom - $top + ($padding * 2));
        $cropped = imagecreatetruecolor($cropWidth, $cropHeight);
        imagealphablending($cropped, false);
        imagesavealpha($cropped, true);
        $transparent = imagecolorallocatealpha($cropped, 255, 255, 255, 127);
        imagefill($cropped, 0, 0, $transparent);
        imagecopy($cropped, $image, 0, 0, $sourceX, $sourceY, $cropWidth, $cropHeight);

        ob_start();
        match ($extension) {
            'jpg', 'jpeg' => imagejpeg($cropped, null, 92),
            'webp' => imagewebp($cropped, null, 92),
            default => imagepng($cropped),
        };
        $result = ob_get_clean();
        imagedestroy($image);
        imagedestroy($cropped);

        return is_string($result) ? $result : $contents;
    }

    private function settingType(mixed $value): string
    {
        if ($value === 'true' || $value === 'false') return 'boolean';
        return 'string';
    }
}
