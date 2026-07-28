<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings
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
            'settings' => 'required|array'
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->settings as $key => $value) {
                if (is_bool($value)) {
                    $value = $value ? 'true' : 'false';
                }
                
                Setting::where('key', $key)->update(['value' => $value]);
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
}
