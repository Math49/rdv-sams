<?php

namespace App\Services;

use App\Models\BookingToken;
use App\Models\Calendar;
use App\Models\User;

class BookingTokenService
{
    private const TOKEN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    /**
     * @return array{token: string, bookingToken: BookingToken}
     */
    public function generateForCalendar(Calendar $calendar, User $actor): array
    {
        $plainToken = $this->generateToken();
        $hash = hash('sha256', $plainToken);

        $bookingToken = new BookingToken([
            'doctorId' => $calendar->doctorId,
            'calendarScope' => $calendar->scope,
            'calendarId' => $calendar->getKey(),
            'specialtyId' => $calendar->specialtyId,
            'expiresAt' => now()->addDay(),
            'createdByUserId' => $actor->getKey(),
        ]);
        $bookingToken->tokenHash = $hash;
        $bookingToken->save();

        return [
            'token' => $plainToken,
            'bookingToken' => $bookingToken,
        ];
    }

    public function validatePlainToken(string $plainToken): ?BookingToken
    {
        $hash = hash('sha256', $plainToken);
        $bookingToken = BookingToken::query()->where('tokenHash', $hash)->first();

        if (! $bookingToken) {
            return null;
        }

        $now = now();
        if (! $bookingToken->expiresAt || $bookingToken->expiresAt->lte($now)) {
            return null;
        }

        if ($bookingToken->usedAt !== null) {
            return null;
        }

        return $bookingToken;
    }

    private function generateToken(int $length = 10): string
    {
        $alphabet = self::TOKEN_ALPHABET;
        $maxIndex = strlen($alphabet) - 1;
        $token = '';

        for ($i = 0; $i < $length; $i++) {
            $token .= $alphabet[random_int(0, $maxIndex)];
        }

        return $token;
    }
}
