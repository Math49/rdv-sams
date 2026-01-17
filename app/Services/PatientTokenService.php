<?php

namespace App\Services;

use App\Models\BookingToken;
use App\Models\Calendar;
use Illuminate\Http\Request;
use MongoDB\BSON\ObjectId;

class PatientTokenService
{
    public const COOKIE_NAME = 'patient_token';
    private const HASH_LENGTH = 64;
    private const TOKEN_LENGTH = 10;

    public function getCookieValue(Request $request): ?string
    {
        $value = $request->cookie(self::COOKIE_NAME);
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    public function resolveValidTokenFromCookie(?string $cookieValue): ?BookingToken
    {
        $value = $this->normalizeCookieValue($cookieValue);
        if (! $value) {
            $this->logIfLocal('patient_token missing');
            return null;
        }

        $bookingToken = $this->resolveTokenFromValue($value);
        if (! $bookingToken) {
            $this->logIfLocal('patient_token not found', ['value' => $value]);
            return null;
        }

        if (! $this->isValid($bookingToken)) {
            $this->logIfLocal('patient_token invalid', [
                'id' => (string) $bookingToken->getKey(),
                'expiresAt' => $bookingToken->expiresAt?->toIso8601String(),
                'usedAt' => $bookingToken->usedAt?->toIso8601String(),
            ]);
            return null;
        }

        return $bookingToken;
    }

    /**
     * @return array<string, string|int|null>
     */
    public function buildContext(BookingToken $bookingToken): array
    {
        $expiresAt = $bookingToken->expiresAt->copy();

        $context = [
            'doctorId' => (string) $bookingToken->doctorId,
            'calendarScope' => $bookingToken->calendarScope,
            'calendarId' => $bookingToken->calendarId ? (string) $bookingToken->calendarId : null,
            'specialtyId' => $bookingToken->specialtyId ? (string) $bookingToken->specialtyId : null,
            'expiresAt' => $expiresAt->toIso8601String(),
        ];

        // Include booking window if a specific calendar is set
        if ($bookingToken->calendarId) {
            $calendar = Calendar::query()->where('_id', new ObjectId((string) $bookingToken->calendarId))->first();
            if ($calendar) {
                $context['bookingMinHours'] = $calendar->getBookingMinHours();
                $context['bookingMaxDays'] = $calendar->getBookingMaxDays();
            }
        }

        return $context;
    }

    private function resolveTokenFromValue(string $value): ?BookingToken
    {
        if ($this->looksLikeObjectId($value)) {
            return $this->findById($value);
        }

        if ($this->looksLikeTokenHash($value)) {
            return BookingToken::query()->where('tokenHash', $value)->first();
        }

        if ($this->looksLikePlainToken($value)) {
            $hash = hash('sha256', $value);
            return BookingToken::query()->where('tokenHash', $hash)->first();
        }

        return null;
    }

    private function findById(string $value): ?BookingToken
    {
        try {
            return BookingToken::query()->where('_id', new ObjectId($value))->first();
        } catch (\Throwable) {
            return null;
        }
    }

    private function isValid(BookingToken $bookingToken): bool
    {
        $now = now();
        if (! $bookingToken->expiresAt || $bookingToken->expiresAt->lte($now)) {
            return false;
        }

        if ($bookingToken->usedAt !== null) {
            return false;
        }

        return true;
    }

    private function normalizeCookieValue(?string $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }

    private function looksLikeObjectId(string $value): bool
    {
        return (bool) preg_match('/^[a-f0-9]{24}$/i', $value);
    }

    private function looksLikeTokenHash(string $value): bool
    {
        return strlen($value) === self::HASH_LENGTH && (bool) preg_match('/^[a-f0-9]{64}$/i', $value);
    }

    private function looksLikePlainToken(string $value): bool
    {
        return strlen($value) === self::TOKEN_LENGTH && (bool) preg_match('/^[A-Z2-9]+$/', $value);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function logIfLocal(string $message, array $context = []): void
    {
        if (! app()->environment('local')) {
            return;
        }

        logger()->info($message, $context);
    }
}
