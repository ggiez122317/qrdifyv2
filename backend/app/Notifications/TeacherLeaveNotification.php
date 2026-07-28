<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;
use App\Models\TeacherLeave;
use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

class TeacherLeaveNotification extends Notification
{

    public $leave;

    /**
     * Create a new notification instance.
     */
    public function __construct(TeacherLeave $leave)
    {
        $this->leave = $leave;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->line('The introduction to the notification.')
            ->action('Notification Action', url('/'))
            ->line('Thank you for using our application!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'teacher_leave',
            'title' => 'New Leave Request from ' . ($this->leave->teacher->name ?? 'a teacher'),
            'message' => ($this->leave->teacher->name ?? 'A teacher') . " has submitted a leave request from {$this->leave->start_date} to {$this->leave->end_date}. Reason: {$this->leave->reason}. Please review and make a decision.",
            'leave_id' => $this->leave->id,
            'teacher_name' => $this->leave->teacher->name ?? 'Unknown',
        ];
    }

    /**
     * Get the broadcast representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'teacher_leave',
            'title' => 'New Leave Request from ' . ($this->leave->teacher->name ?? 'a teacher'),
            'message' => ($this->leave->teacher->name ?? 'A teacher') . " has submitted a leave request from {$this->leave->start_date} to {$this->leave->end_date}. Reason: {$this->leave->reason}.",
            'leave_id' => $this->leave->id,
            'teacher_name' => $this->leave->teacher->name ?? 'Unknown',
        ]);
    }

    public function toWebPush($notifiable, $notification)
    {
        return (new WebPushMessage)
            ->title('New Leave Request from ' . ($this->leave->teacher->name ?? 'a teacher'))
            ->body(($this->leave->teacher->name ?? 'A teacher') . " has submitted a leave from {$this->leave->start_date} to {$this->leave->end_date}.")
            ->icon('/logo.png');
    }
}
