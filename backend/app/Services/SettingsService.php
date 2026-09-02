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
                    if ($val === 'true') return true;
                    if ($val === 'false') return false;
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
            'school_start_time'        => ['value' => '07:30', 'type' => 'time', 'desc' => 'Time school officially starts'],
            'late_threshold'           => ['value' => '07:45', 'type' => 'time', 'desc' => 'Time after which a student is marked Late'],
            'school_end_time'          => ['value' => '16:00', 'type' => 'time', 'desc' => 'Time school officially ends'],
            'enable_sms_notifications' => ['value' => 'false', 'type' => 'boolean', 'desc' => 'Send SMS to parents on scan'],
            'enable_push_notifications' => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Enable in-app and push notifications'],
            'enable_email_notifications' => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Enable email notifications'],
            'notify_check_in'            => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Send notifications for student time-in events'],
            'notify_check_out'           => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Send notifications for student time-out events'],
            'notify_late'                => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Send notifications for late arrivals'],
            'notify_early'               => ['value' => 'true', 'type' => 'boolean', 'desc' => 'Send notifications for early dismissal'],
            'principal_name'            => ['value' => 'MERLE B. ALSONADO', 'type' => 'string', 'desc' => 'Principal name printed on school IDs'],
            'principal_position'        => ['value' => 'PRINCIPAL I', 'type' => 'string', 'desc' => 'Principal position printed on school IDs'],
            'principal_signature'       => ['value' => '', 'type' => 'image', 'desc' => 'Principal electronic signature printed on school IDs'],
            'school_year'               => ['value' => now()->format('Y').'-'.now()->addYear()->format('Y'), 'type' => 'string', 'desc' => 'School year printed on school IDs'],
            'timezone'                  => ['value' => 'Asia/Manila', 'type' => 'string', 'desc' => 'System display timezone'],
            'date_format'               => ['value' => 'MM/DD/YYYY', 'type' => 'string', 'desc' => 'System date display format'],
            'default_theme'             => ['value' => 'light', 'type' => 'string', 'desc' => 'Default system color theme'],
            'compact_tables'            => ['value' => 'false', 'type' => 'boolean', 'desc' => 'Use compact table spacing'],
        ];

        $timestamp = now();
        $rows = [];
        foreach ($defaults as $key => $data) {
            $rows[] = [
                'key' => $key,
                'value' => $data['value'],
                'type' => $data['type'],
                'description' => $data['desc'],
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        Setting::query()->insertOrIgnore($rows);
    }
}
