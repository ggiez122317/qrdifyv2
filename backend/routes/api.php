<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\PrincipalController;
use App\Http\Controllers\Api\PhotoBoothController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Teacher\TeacherStudentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\VisitorController;
use App\Http\Controllers\FeedbackController;

$registerPublicRoutes = function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:3,1');
    Route::get('/system/maintenance/status', [\App\Http\Controllers\Api\SystemController::class, 'getMaintenanceStatus']);

    Route::prefix('photobooth')->group(function () {
        Route::get('/missing-photos', [PhotoBoothController::class, 'missingPhotos']);
        Route::post('/upload-photo', [PhotoBoothController::class, 'uploadPhoto']);
    });

    Route::post('/scan', [AttendanceController::class, 'scan'])->middleware('throttle:300,1');
    Route::post('/scan/lookup', [AttendanceController::class, 'lookup'])->middleware('throttle:300,1');
    Route::get('/scan/cache-all', [AttendanceController::class, 'cacheAll']);
};

$registerPublicRoutes();
Route::prefix('v1')->group($registerPublicRoutes);

$registerAuthenticatedRoutes = function () {
    // Auth info
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Notifications (Shared)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/mark-as-read', [NotificationController::class, 'markAsRead']);
        Route::post('/{id}/mark-as-read', [NotificationController::class, 'markOneAsRead']);
        Route::delete('/{id}', [NotificationController::class, 'destroy']);
        Route::post('/delete-selected', [NotificationController::class, 'destroySelected']);
    });

    // Web Push Subscriptions
    Route::post('/push-subscriptions', [PushSubscriptionController::class, 'subscribe']);
    Route::delete('/push-subscriptions', [PushSubscriptionController::class, 'unsubscribe']);

    // Lookup endpoints (shared across roles)
    Route::get('/grade-levels', [\App\Http\Controllers\Admin\GradeLevelController::class, 'listAll']);
    Route::get('/sections/list-all', [\App\Http\Controllers\Admin\SectionController::class, 'listAll']);
    Route::get('/subjects', [\App\Http\Controllers\Admin\SubjectController::class, 'listAll']);

    /**
     * Student Dashboard Access
     */
    Route::middleware('role:student')->group(function () {
        Route::get('/student/dashboard', [StudentController::class, 'dashboard']);
        Route::get('/student/attendance-record', [StudentController::class, 'attendanceRecord']);
        Route::post('/student/location', [\App\Http\Controllers\Api\MapController::class, 'reportLocation']);
        Route::get('/student/schedules', [StudentController::class, 'getSchedules']);
        Route::post('/student/schedules', [StudentController::class, 'addSchedule']);
        Route::put('/student/schedules/{id}', [StudentController::class, 'updateSchedule']);
        Route::delete('/student/schedules/{id}', [StudentController::class, 'deleteSchedule']);
        Route::post('/student/schedules/{id}/trigger-alarm', [StudentController::class, 'triggerAlarmNotification']);

        // Teachers list (for excuse letter recipient selection)
        Route::get('/student/teachers', [StudentController::class, 'getTeachers']);

        // Excuse Letters
        Route::get('/student/excuse-letters', [StudentController::class, 'getExcuseLetters']);
        Route::post('/student/excuse-letters', [StudentController::class, 'submitExcuseLetter']);
        Route::delete('/student/excuse-letters/{id}', [StudentController::class, 'deleteExcuseLetter']);
    });

    /**
     * Teacher Dashboard Access
     */
    Route::middleware('role:teacher')->group(function () {
        Route::get('/teacher/dashboard', [TeacherController::class, 'dashboard']);
        Route::get('/teacher/assigned-classes', [TeacherController::class, 'assignedClasses']);
        Route::get('/teacher/class-attendance', [TeacherController::class, 'classAttendance']);
        Route::get('/teacher/assigned-students', [TeacherController::class, 'assignedStudents']);
        Route::get('/teacher/assigned-students/{id}/attendance', [TeacherController::class, 'studentAttendanceRecord']);
        Route::get('/teacher/absent-students', [TeacherController::class, 'absentStudents']);
        Route::get('/teacher/reports', [TeacherController::class, 'reports']);
        Route::post('/teacher/send-notice', [TeacherController::class, 'sendNotice']);

        // Excuse Letters
        Route::get('/teacher/excuse-letters', [TeacherController::class, 'getExcuseLetters']);
        Route::post('/teacher/excuse-letters/{id}/approve', [TeacherController::class, 'approveExcuseLetter']);
        Route::post('/teacher/excuse-letters/{id}/reject', [TeacherController::class, 'rejectExcuseLetter']);

        // Teacher Leaves
        Route::get('/teacher/leaves', [TeacherController::class, 'getLeaves']);
        Route::post('/teacher/leaves', [TeacherController::class, 'submitLeave']);
        Route::delete('/teacher/leaves/{id}', [TeacherController::class, 'deleteLeave']);

        // Teacher Student Management
        Route::get('/teacher/students/options', [TeacherStudentController::class, 'options']);
        Route::apiResource('teacher/students', TeacherStudentController::class)->except(['create', 'edit']);
    });

    /**
     * Shared Analytics & Monitoring
     */
    Route::middleware('role:principal,super-admin,admin,guard')->group(function () {
        // Attendance Overview
        Route::get('/attendance/today', [AttendanceController::class, 'today']);
        Route::get('/attendance/stats', [AttendanceController::class, 'stats']);
        Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy']);

        // Student & Teacher Management (Shared across Guard, Admin, Principal)
        Route::get('/students-stats', [StudentController::class, 'stats']);
        Route::get('/teachers-stats', [TeacherController::class, 'stats']);
        Route::apiResource('students', StudentController::class)->only(['index', 'store', 'show', 'update']);
        Route::apiResource('teachers', TeacherController::class)->only(['index', 'store', 'show', 'update']);

        // Map Data (Shared for Admin & Principal)
        Route::prefix('admin/map')->group(function () {
            Route::get('/geofence', [\App\Http\Controllers\Api\MapController::class, 'getGeofence']);
            Route::get('/student-locations', [\App\Http\Controllers\Api\MapController::class, 'getStudentLocations']);
            Route::get('/stats', [\App\Http\Controllers\Api\SchoolController::class, 'stats']);
            Route::get('/schools', [\App\Http\Controllers\Api\SchoolController::class, 'index']);
            Route::get('/schools/{school}', [\App\Http\Controllers\Api\SchoolController::class, 'show']);
        });
    });

    /**
     * Guard Specific Endpoints
     */
    Route::middleware('role:guard')->group(function () {
        Route::get('/visitors', [VisitorController::class, 'index']);
        Route::post('/visitors', [VisitorController::class, 'store']);
        Route::put('/visitors/{visitor}', [VisitorController::class, 'update']);
        Route::post('/visitors/{visitor}/mark-out', [VisitorController::class, 'markOut']);
        Route::delete('/visitors/{visitor}', [VisitorController::class, 'destroy']);
        // RFID and NFC modules have been removed. See _deprecated/nfc-rfid-modules/ for backup.
    });

    // Feedback routes can be shared across all authenticated users but we'll place it here
    Route::post('/feedbacks', [FeedbackController::class, 'store']);

    /**
     * Principal / Admin Endpoints
     */
    Route::middleware('role:super-admin,admin')->group(function () {
        Route::apiResource('admin/grade-levels', \App\Http\Controllers\Admin\GradeLevelController::class);
        Route::apiResource('admin/sections', \App\Http\Controllers\Admin\SectionController::class);
        Route::apiResource('admin/subjects', \App\Http\Controllers\Admin\SubjectController::class);

        Route::prefix('admin/map')->group(function () {
            Route::post('/geofence', [\App\Http\Controllers\Api\MapController::class, 'saveGeofence']);
            Route::delete('/geofence', [\App\Http\Controllers\Api\MapController::class, 'deleteGeofence']);
            Route::apiResource('schools', \App\Http\Controllers\Api\SchoolController::class)->except(['index', 'show']);
        });

        Route::prefix('system')->group(function () {
            // Maintenance Mode
            Route::post('/maintenance', [\App\Http\Controllers\Api\SystemController::class, 'toggleMaintenance']);

            // User Management
            Route::get('/logs', [\App\Http\Controllers\Api\SystemController::class, 'getLogs']);
            
            // Admin Dashboard Data
            Route::get('/admin/dashboard', [\App\Http\Controllers\Api\AdminDashboardController::class, 'index']);
            
            Route::get('/users', [\App\Http\Controllers\Api\SystemController::class, 'getUsers']);
            Route::post('/users', [\App\Http\Controllers\Api\SystemController::class, 'storeUser']);
            Route::post('/users/{id}/block', [\App\Http\Controllers\Api\SystemController::class, 'blockUser']);
            Route::delete('/users/{id}', [\App\Http\Controllers\Api\SystemController::class, 'destroyUser']);
        });

        // RFID and NFC modules have been removed. See _deprecated/nfc-rfid-modules/ for backup.
    });

    Route::middleware('role:principal')->group(function () {

        // Principal Specific Data
        Route::prefix('principal')->group(function () {
            Route::get('/employees', [PrincipalController::class, 'getEmployees']);
            Route::get('/students-at-risk', [PrincipalController::class, 'getStudentsAtRisk']);
            Route::get('/online-students', [PrincipalController::class, 'getOnlineStudents']);
            
            // Communications
            Route::post('/notices', [PrincipalController::class, 'sendNotice']);
            Route::get('/notices', [PrincipalController::class, 'getNotices']);
            
            Route::post('/announcements', [PrincipalController::class, 'broadcastAnnouncement']);
            Route::get('/announcements', [PrincipalController::class, 'getAnnouncements']);
            Route::put('/announcements/{id}', [PrincipalController::class, 'updateAnnouncement']);
            Route::delete('/announcements/{id}', [PrincipalController::class, 'deleteAnnouncement']);
            Route::get('/announcement-templates', [PrincipalController::class, 'getAnnouncementTemplates']);
            
            // Settings
            Route::get('/settings', [SettingsController::class, 'index']);
            Route::post('/settings', [SettingsController::class, 'update']);
        });
    });
};

Route::middleware(['auth:sanctum', \App\Http\Middleware\CheckBlockedUser::class, \App\Http\Middleware\CheckMaintenanceMode::class, 'throttle:60,1'])->group($registerAuthenticatedRoutes);
Route::prefix('v1')->middleware(['auth:sanctum', \App\Http\Middleware\CheckBlockedUser::class, \App\Http\Middleware\CheckMaintenanceMode::class, 'throttle:60,1'])->group($registerAuthenticatedRoutes);
