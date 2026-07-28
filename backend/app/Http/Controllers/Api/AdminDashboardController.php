<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(
            $this->dashboardService->getAdminDashboard()
        );
    }
}
