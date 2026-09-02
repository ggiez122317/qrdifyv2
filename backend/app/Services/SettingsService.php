<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Centralized service for reading system settings.
 * Caches settings for 1 hour to avoid DB hits on every request.
 * Used by controllers (especially AttendanceController) to read thresholds.
 */
class SettingsService
{
    private const CACHE_KEY = 'system_settings';

    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Get all settings as a key-value collection.
     */
    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $this->seedDefaults();

            return Setting::all()
                ->pluck('value', 'key')
                ->map(function ($val) {
                    if ($val === 'true') {
                        return true;
                    }
                    if ($val === 'false') {
                        return false;
                    }

                    return $val;
                })
                ->toArray();
        });
    }

    /**
     * Get a single setting value by key, with an optional default.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $settings = $this->all();

        return $settings[$key] ?? $default;
    }

    /**
     * Invalidate the settings cache (call after updates).
     */
    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Seed default settings if they don't exist yet.
     */
    private function seedDefaults(): void
    {
        $defaults = [
            'school_start_time' => ['value' => '07:30', 'type' => 'time', 'desc' => 'Time school officially starts'],
            'late_threshold' => ['value' => '07:45', 'type' => 'time', 'desc' => 'Time after which a student is marked Late'],
            'school_end_time' => ['value' => '16:00', 'type' => 'time', 'desc' => 'Time school officially ends'],
            'enable_sms_notifications' => ['value' => 'false', 'type' => 'boolean', 'desc' => 'Send SMS to parents on scan'],
            'scan_deduplication_seconds' => ['value' => '10', 'type' => 'integer', 'desc' => 'Ignore repeated scans within this many seconds'],
            'notify_check_in' => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Notify parents when students enter'],
            'notify_check_out' => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Notify parents when students leave'],
            'notify_late' => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Notify parents about late arrivals'],
            'notify_early' => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Notify parents about early dismissals'],
            'phone_number' => ['value' => '', 'type' => 'string', 'desc' => 'Recipient used for SMS connection tests'],
        ];

        foreach ($defaults as $key => $data) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => $data['value'], 'type' => $data['type'], 'description' => $data['desc']]
            );
        }
    }
}
