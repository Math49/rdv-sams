<?php

namespace App\Http\Controllers\Api\Patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\ValidatePatientTokenRequest;
use App\Services\BookingTokenService;
use App\Services\PatientTokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientTokenController extends Controller
{
    public function __construct(
        private BookingTokenService $bookingTokenService,
        private PatientTokenService $patientTokenService
    ) {
    }

    public function store(ValidatePatientTokenRequest $request): JsonResponse
    {
        $plainToken = trim($request->validated()['token']);
        $bookingToken = $this->bookingTokenService->validatePlainToken($plainToken);

        if (! $bookingToken) {
            return response()->json([
                'message' => 'Invalid or expired token',
            ], 401);
        }

        $expiresAt = $bookingToken->expiresAt?->copy();
        if (! $expiresAt || $expiresAt->lte(now())) {
            return response()->json([
                'message' => 'Invalid or expired token',
            ], 401);
        }

        $seconds = now()->diffInSeconds($expiresAt, false);
        if ($seconds <= 0) {
            return response()->json([
                'message' => 'Invalid or expired token',
            ], 401);
        }

        $minutes = (int) ceil($seconds / 60);

        $cookie = cookie(
            PatientTokenService::COOKIE_NAME,
            (string) $bookingToken->getKey(),
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
            'data' => $this->patientTokenService->buildContext($bookingToken),
        ])->withCookie($cookie);
    }

    public function context(Request $request): JsonResponse
    {
        $context = $request->attributes->get('patientTokenContext');
        if (! $context) {
            return response()->json([
                'message' => 'Patient token required',
            ], 401);
        }

        return response()->json([
            'message' => 'Patient context loaded',
            'data' => $context,
        ]);
    }
}
