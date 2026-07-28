<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StudentScannedNotification extends Notification
{
    use Queueable;

    private $studentName;
    private $scanType;
    private $scanTime;
    private $status;

    public function __construct($studentName, $scanType, $scanTime, $status)
    {
        $this->studentName = $studentName;
        $this->scanType = $scanType;
        $this->scanTime = $scanTime;
        $this->status = $status;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => "Student {$this->scanType}",
            'message' => "{$this->studentName} scanned {$this->scanType} at {$this->scanTime} ({$this->status})",
            'student_name' => $this->studentName,
            'scan_type' => $this->scanType,
            'scan_time' => $this->scanTime,
            'status' => $this->status,
        ];
    }
}
