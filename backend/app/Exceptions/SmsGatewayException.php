<?php

namespace App\Exceptions;

use RuntimeException;

class SmsGatewayException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly ?string $providerResponse = null,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
