<?php

namespace App\Console\Commands;

use App\Services\ScanCacheService;
use Illuminate\Console\Command;

class WarmScanCache extends Command
{
    protected $signature = 'scan:cache-warm';
    protected $description = 'Preload all student/teacher data into the scan cache';

    public function handle(ScanCacheService $cache): int
    {
        $cache->warm();
        $this->info('Scan cache warmed successfully');
        return Command::SUCCESS;
    }
}