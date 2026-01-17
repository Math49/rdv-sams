<?php

namespace App\Http\Controllers\Api\Appointments;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\CancelAppointmentRequest;
use App\Http\Requests\Appointments\StoreAppointmentRequest;
use App\Http\Requests\Appointments\UpdateAppointmentRequest;
use App\Http\Requests\Patient\StorePatientAppointmentRequest;
use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\Calendar;
use App\Models\User;
use App\Services\AppointmentService;
use App\Services\AuditService;
use App\Services\AvailabilityService;
use App\Services\PatientTokenService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MongoDB\BSON\ObjectId;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function __construct(
        private AvailabilityService $availabilityService,
        private AppointmentService $appointmentService,
        private AuditService $auditService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $query = Appointment::query();

        if ($this->isAdmin($user)) {
            if ($doctorId = $request->query('doctorId')) {
                $query->where('doctorId', new ObjectId($doctorId));
            } else {
                $doctorIds = $this->parseIds($request->query('doctorIds'));
                if (count($doctorIds) > 0) {
                    $query->whereIn('doctorId', $doctorIds);
                }
            }
            if ($calendarId = $request->query('calendarId')) {
                $query->where('calendarId', new ObjectId($calendarId));
            }
            if ($status = $request->query('status')) {
                $query->where('status', $status);
            }
        } else {
            $query->where('doctorId', new ObjectId($user->getKey()));
            $calendarIds = $this->parseIds($request->query('calendarIds'));
            if (count($calendarIds) > 0) {
                $query->whereIn('calendarId', $calendarIds);
            }
        }

        if ($from = $request->query('from')) {
            $query->where('startAt', '>=', Carbon::parse($from));
        }

        if ($to = $request->query('to')) {
            $query->where('startAt', '<=', Carbon::parse($to));
        }

        return response()->json([
            'message' => 'Appointments loaded',
            'data' => $query->get(),
        ]);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $calendar = Calendar::query()->where('_id', new ObjectId($data['calendarId']))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if (! $this->isAdmin($user)) {
            if ($calendar->scope === 'sams') {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            if ((string) $calendar->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $doctorId = $this->isAdmin($user)
            ? ($data['doctorId'] ?? (string) $calendar->doctorId)
            : $user->getKey();

        if (! $doctorId) {
            return response()->json([
                'message' => 'Doctor required',
                'errors' => ['doctorId' => ['Doctor is required']],
            ], 422);
        }

        if ($calendar->doctorId && (string) $calendar->doctorId !== $doctorId) {
            return response()->json([
                'message' => 'Calendar mismatch',
                'errors' => ['calendarId' => ['Calendar does not belong to this doctor']],
            ], 422);
        }

        $appointmentType = AppointmentType::query()->where('_id', new ObjectId($data['appointmentTypeId']))->first();
        if (! $appointmentType) {
            return response()->json(['message' => 'Appointment type not found'], 404);
        }

        if ((string) $appointmentType->calendarId !== $data['calendarId']) {
            return response()->json([
                'message' => 'Appointment type mismatch',
                'errors' => ['appointmentTypeId' => ['Appointment type does not belong to this calendar']],
            ], 422);
        }

        if ((string) $appointmentType->doctorId !== $doctorId) {
            return response()->json([
                'message' => 'Appointment type mismatch',
                'errors' => ['appointmentTypeId' => ['Appointment type does not belong to this doctor']],
            ], 422);
        }

        if (! $appointmentType->isActive) {
            return response()->json([
                'message' => 'Appointment type inactive',
                'errors' => ['appointmentTypeId' => ['Appointment type is inactive']],
            ], 422);
        }

        $startAt = Carbon::parse($data['startAt']);
        $endAt = $startAt->copy()->addMinutes($this->slotLengthMinutes($appointmentType));

        if (! $this->availabilityService->isSlotAvailable($doctorId, $data['calendarId'], $startAt, $appointmentType)) {
            return response()->json([
                'message' => 'Slot unavailable',
                'errors' => ['startAt' => ['Slot is not available']],
            ], 422);
        }

        if ($this->appointmentService->hasOverlap($doctorId, $startAt, $endAt)) {
            return response()->json([
                'message' => 'Overlap detected',
                'errors' => ['startAt' => ['Appointment overlaps with existing booking']],
            ], 422);
        }

        $appointment = Appointment::query()->create([
            'calendarId' => $data['calendarId'],
            'doctorId' => $doctorId,
            'specialtyId' => $appointmentType->specialtyId ?? $calendar->specialtyId,
            'appointmentTypeId' => $data['appointmentTypeId'],
            'startAt' => $startAt,
            'endAt' => $endAt,
            'status' => 'booked',
            'createdBy' => $user->getKey(),
            'patient' => $data['patient'],
            'reason' => $data['reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Appointment created',
            'data' => $appointment,
        ]);
    }

    public function update(UpdateAppointmentRequest $request, string $id): JsonResponse
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
        $appointmentType = $appointment->appointmentTypeId
            ? AppointmentType::query()->where('_id', new ObjectId((string) $appointment->appointmentTypeId))->first()
            : null;

        if (isset($data['appointmentTypeId'])) {
            $appointmentType = AppointmentType::query()->where('_id', new ObjectId($data['appointmentTypeId']))->first();
            if (! $appointmentType) {
                return response()->json(['message' => 'Appointment type not found'], 404);
            }

            if ((string) $appointmentType->calendarId !== (string) $appointment->calendarId) {
                return response()->json([
                    'message' => 'Appointment type mismatch',
                    'errors' => ['appointmentTypeId' => ['Appointment type does not belong to this calendar']],
                ], 422);
            }

            if ((string) $appointmentType->doctorId !== (string) $appointment->doctorId) {
                return response()->json([
                    'message' => 'Appointment type mismatch',
                    'errors' => ['appointmentTypeId' => ['Appointment type does not belong to this doctor']],
                ], 422);
            }

            if (! $appointmentType->isActive) {
                return response()->json([
                    'message' => 'Appointment type inactive',
                    'errors' => ['appointmentTypeId' => ['Appointment type is inactive']],
                ], 422);
            }
        }

        if (! $appointmentType) {
            return response()->json(['message' => 'Appointment type not found'], 404);
        }

        $startAt = isset($data['startAt'])
            ? Carbon::parse($data['startAt'])
            : $appointment->startAt->copy();
        $endAt = $startAt->copy()->addMinutes($this->slotLengthMinutes($appointmentType));

        if (isset($data['startAt']) || isset($data['appointmentTypeId'])) {
            if (! $this->availabilityService->isSlotAvailable(
                (string) $appointment->doctorId,
                (string) $appointment->calendarId,
                $startAt,
                $appointmentType,
                $id
            )) {
                return response()->json([
                    'message' => 'Slot unavailable',
                    'errors' => ['startAt' => ['Slot is not available']],
                ], 422);
            }

            if ($this->appointmentService->hasOverlap((string) $appointment->doctorId, $startAt, $endAt, $id)) {
                return response()->json([
                    'message' => 'Overlap detected',
                    'errors' => ['startAt' => ['Appointment overlaps with existing booking']],
                ], 422);
            }
        }

        if (isset($data['appointmentTypeId'])) {
            $appointment->appointmentTypeId = $data['appointmentTypeId'];
            $calendar = Calendar::query()->where('_id', new ObjectId((string) $appointment->calendarId))->first();
            $appointment->specialtyId = $appointmentType->specialtyId ?? $calendar?->specialtyId;
        }

        if (isset($data['startAt']) || isset($data['appointmentTypeId'])) {
            $appointment->startAt = $startAt;
            $appointment->endAt = $endAt;
        }

        if (isset($data['patient'])) {
            $appointment->patient = array_merge($appointment->patient ?? [], $data['patient']);
        }

        if (array_key_exists('reason', $data)) {
            $appointment->reason = $data['reason'];
        }

        $appointment->save();

        return response()->json([
            'message' => 'Appointment updated',
            'data' => $appointment,
        ]);
    }

    public function cancel(CancelAppointmentRequest $request, string $id): JsonResponse
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

        $appointment->status = 'cancelled';
        if ($request->validated()['reason'] ?? null) {
            $appointment->cancelReason = $request->validated()['reason'];
        }
        $appointment->save();

        return response()->json([
            'message' => 'Appointment cancelled',
            'data' => $appointment,
        ]);
    }

    public function storePatient(StorePatientAppointmentRequest $request): JsonResponse
    {
        $bookingToken = $request->attributes->get('bookingToken');
        if (! $bookingToken) {
            return response()->json(['message' => 'Patient token required'], 401);
        }

        $data = $request->validated();
        $calendar = Calendar::query()->where('_id', new ObjectId($data['calendarId']))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if ($calendar->scope === 'sams') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((string) $calendar->doctorId !== (string) $bookingToken->doctorId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken->calendarId && (string) $bookingToken->calendarId !== $data['calendarId']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken->calendarScope && $bookingToken->calendarScope !== $calendar->scope) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // For specialty scope calendars, verify the specialty matches if token has specialtyId restriction
        // Doctor scope calendars don't have a specialtyId, so skip this check for them
        if ($bookingToken->specialtyId && $calendar->scope === 'specialty') {
            if ((string) $bookingToken->specialtyId !== (string) $calendar->specialtyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $appointmentType = AppointmentType::query()->where('_id', new ObjectId($data['appointmentTypeId']))->first();
        if (! $appointmentType) {
            return response()->json(['message' => 'Appointment type not found'], 404);
        }

        if ((string) $appointmentType->calendarId !== $data['calendarId']) {
            return response()->json([
                'message' => 'Appointment type mismatch',
                'errors' => ['appointmentTypeId' => ['Appointment type does not belong to this calendar']],
            ], 422);
        }

        if ((string) $appointmentType->doctorId !== (string) $bookingToken->doctorId) {
            return response()->json([
                'message' => 'Appointment type mismatch',
                'errors' => ['appointmentTypeId' => ['Appointment type does not belong to this doctor']],
            ], 422);
        }

        if (! $appointmentType->isActive) {
            return response()->json([
                'message' => 'Appointment type inactive',
                'errors' => ['appointmentTypeId' => ['Appointment type is inactive']],
            ], 422);
        }

        $startAt = Carbon::parse($data['startAt']);
        $endAt = $startAt->copy()->addMinutes($this->slotLengthMinutes($appointmentType));

        // Validate booking window
        $now = now();
        $bookingMinHours = $calendar->getBookingMinHours();
        $bookingMaxDays = $calendar->getBookingMaxDays();
        $minStart = $now->copy()->addHours($bookingMinHours);
        $maxStart = $now->copy()->addDays($bookingMaxDays)->endOfDay();
        $timezone = config('app.timezone', 'Europe/Paris');

        if ($startAt->lt($minStart)) {
            $minFormatted = $minStart->copy()->setTimezone($timezone)->format('d/m/Y H:i');
            return response()->json([
                'message' => 'Créneau hors fenêtre de réservation',
                'errors' => ['startAt' => ["Vous ne pouvez réserver qu'à partir du {$minFormatted}."]],
            ], 422);
        }

        if ($startAt->gt($maxStart)) {
            $maxFormatted = $maxStart->copy()->setTimezone($timezone)->format('d/m/Y H:i');
            return response()->json([
                'message' => 'Créneau hors fenêtre de réservation',
                'errors' => ['startAt' => ["Vous ne pouvez réserver que jusqu'au {$maxFormatted}."]],
            ], 422);
        }

        if (! $this->availabilityService->isSlotAvailable(
            (string) $bookingToken->doctorId,
            $data['calendarId'],
            $startAt,
            $appointmentType
        )) {
            return response()->json([
                'message' => 'Slot unavailable',
                'errors' => ['startAt' => ['Slot is not available']],
            ], 422);
        }

        if ($this->appointmentService->hasOverlap((string) $bookingToken->doctorId, $startAt, $endAt)) {
            return response()->json([
                'message' => 'Overlap detected',
                'errors' => ['startAt' => ['Appointment overlaps with existing booking']],
            ], 422);
        }

        $appointment = Appointment::query()->create([
            'calendarId' => $data['calendarId'],
            'doctorId' => (string) $bookingToken->doctorId,
            'specialtyId' => $appointmentType->specialtyId ?? $calendar->specialtyId,
            'appointmentTypeId' => $data['appointmentTypeId'],
            'startAt' => $startAt,
            'endAt' => $endAt,
            'status' => 'booked',
            'createdBy' => 'patient',
            'patient' => $data['patient'],
            'reason' => $data['reason'] ?? null,
        ]);

        $bookingToken->usedAt = now();
        $bookingToken->usedMeta = [
            'ip' => $request->ip(),
            'userAgent' => $request->userAgent(),
        ];
        $bookingToken->save();

        $this->auditService->log(null, 'appointment_created', 'appointment', (string) $appointment->getKey(), [
            'source' => 'patient',
        ]);

        return response()->json([
            'message' => 'Appointment created',
            'data' => $appointment,
        ])->withCookie(cookie()->forget(PatientTokenService::COOKIE_NAME));
    }

    /**
     * @return array<int, ObjectId>
     */
    private function parseIds(string|array|null $value): array
    {
        if (! $value) {
            return [];
        }

        $ids = is_array($value) ? $value : array_filter(array_map('trim', explode(',', $value)));

        return array_map(fn (string $id) => new ObjectId($id), $ids);
    }

    private function slotLengthMinutes(AppointmentType $appointmentType): int
    {
        return (int) $appointmentType->durationMinutes
            + (int) ($appointmentType->bufferBeforeMinutes ?? 0)
            + (int) ($appointmentType->bufferAfterMinutes ?? 0);
    }
}
