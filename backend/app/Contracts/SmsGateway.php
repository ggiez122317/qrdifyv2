<?php

namespace App\Contracts;

use App\Data\SmsSendResult;

interface SmsGateway
{
    public function send(string $recipient, string $message): SmsSendResult;
}
