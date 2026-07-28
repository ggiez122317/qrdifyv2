<?php

namespace App\Jobs;

use App\Services\AttendanceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;

class ProcessAttendanceLog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public $tries = 3;
    public $backoff = [5, 15, 30];

    public function __construct(
        private readonly string $idNumber
    ) {}

    public function handle(AttendanceService $attendanceService): void
    {
        $result = $attendanceService->processScan($this->idNumber);

        if (isset($result['error'])) {
            // Log warning but don't retry for user-not-found (404) — it won't fix itself
            if ($result['code'] === 404) {
                logger()->warning('Attendance scan skipped: user not found', [
                    'id_number' => $this->idNumber,
                ]);
                $this->delete();
                return;
            }
            // For other errors, release back to queue for retry
            $this->release(30);
        }
    }
}
