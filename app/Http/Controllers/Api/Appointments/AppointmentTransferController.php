<?php

namespace App\Http\Controllers\Api\Appointments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\TransferAppointmentRequest;
use App\Models\Appointment;
use App\Models\User;
use App\Services\AppointmentService;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use MongoDB\BSON\ObjectId;

class AppointmentTransferController extends Controller
{
    public function __construct(
        private AppointmentService $appointmentService,
        private AuditService $auditService
    ) {
    }

    public function store(TransferAppointmentRequest $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $appointment = Appointment::query()->where('_id', new ObjectId($id))->first();
        if (! $appointment) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        if (! $this->isAdmin($user) && (string) $appointment->doctorId !== $user->getKey()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();
        $toDoctorId = $data['toDoctorId'];
        $startAt = $appointment->startAt->copy();
        $endAt = $appointment->endAt->copy();

        if ($this->appointmentService->hasOverlap($toDoctorId, $startAt, $endAt, $id)) {
            return response()->json([
                'message' => 'Overlap detected',
                'errors' => ['toDoctorId' => ['Appointment overlaps with existing booking']],
            ], 422);
        }

        $appointment->transfer = [
            'fromDoctorId' => (string) $appointment->doctorId,
            'toDoctorId' => $toDoctorId,
            'reason' => $data['reason'] ?? null,
            'transferredAt' => now(),
        ];
        $appointment->doctorId = $toDoctorId;
        $appointment->save();

        $this->auditService->log($user, 'appointment_transferred', 'appointment', (string) $appointment->getKey(), [
            'fromDoctorId' => (string) $appointment->transfer['fromDoctorId'],
            'toDoctorId' => $toDoctorId,
        ]);

        return response()->json([
            'message' => 'Appointment transferred',
            'data' => $appointment,
        ]);
    }
}
