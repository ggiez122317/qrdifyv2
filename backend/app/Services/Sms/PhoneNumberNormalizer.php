<?php

namespace App\Services\Sms;

class PhoneNumberNormalizer
{
    public function normalizePhilippineMobile(?string $phoneNumber): ?string
    {
        if ($phoneNumber === null || trim($phoneNumber) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phoneNumber);

        if ($digits === null) {
            return null;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '09')) {
            return '+63'.substr($digits, 1);
        }

        if (strlen($digits) === 12 && str_starts_with($digits, '639')) {
            return '+'.$digits;
        }

        return null;
    }
}
