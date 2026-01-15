<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\ValidatePatientTokenRequest;
use App\Services\BookingTokenService;
use Illuminate\Http\JsonResponse;

class PatientTokenController extends Controller
{
    public function __construct(private BookingTokenService $bookingTokenService)
    {
    }

    public function store(ValidatePatientTokenRequest $request): JsonResponse
    {
        $plainToken = trim($request->validated()['token']);
        $bookingToken = $this->bookingTokenService->validatePlainToken($plainToken);

        if (! $bookingToken) {
            return response()->json([
                'message' => 'Invalid or expired token',
                'errors' => ['token' => ['Invalid or expired token']],
            ], 422);
        }

        $expiresAt = $bookingToken->expiresAt->copy()->utc();
        $seconds = $expiresAt->diffInSeconds(now('UTC'), false);
        if ($seconds <= 0) {
            return response()->json([
                'message' => 'Invalid or expired token',
                'errors' => ['token' => ['Invalid or expired token']],
            ], 422);
        }

        $minutes = (int) ceil($seconds / 60);

        $cookie = cookie(
            'patient_token',
            $plainToken,
            $minutes,
            '/',
            null,
            app()->environment('production'),
            true,
            false,
            'lax'
        );

        return response()->json([
            'message' => 'Token validated',
            'data' => [
                'doctorId' => (string) $bookingToken->doctorId,
                'calendarScope' => $bookingToken->calendarScope,
                'calendarId' => $bookingToken->calendarId ? (string) $bookingToken->calendarId : null,
                'specialtyId' => $bookingToken->specialtyId ? (string) $bookingToken->specialtyId : null,
                'expiresAt' => $expiresAt->toIso8601String(),
            ],
        ])->withCookie($cookie);
    }
}
