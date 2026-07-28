<?php

namespace App\Providers;

use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use App\Services\ScanCacheService;
use Illuminate\Support\ServiceProvider;
use Spatie\Permission\Events\RoleAttached;
use Spatie\Permission\Events\RoleDetached;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ScanCacheService::class);
    }

    public function boot(): void
    {
        $invalidate = fn() => app(ScanCacheService::class)->invalidate();

        User::saved($invalidate);
        User::deleted($invalidate);
        StudentProfile::saved($invalidate);
        StudentProfile::deleted($invalidate);
        TeacherProfile::saved($invalidate);
        TeacherProfile::deleted($invalidate);

        $this->app['events']->listen(RoleAttached::class, $invalidate);
        $this->app['events']->listen(RoleDetached::class, $invalidate);
    }
}
