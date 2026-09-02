<?php

namespace App\Data;

final readonly class SmsSendResult
{
    public function __construct(
        public string $provider,
        public string $response,
    ) {}
}
