<?php

namespace App\Http\Controllers\Api\Availability;

use App\Http\Controllers\Controller;
use App\Http\Requests\Availability\GetAvailabilityFeedRequest;
use App\Http\Requests\Availability\GetAvailabilitySlotsRequest;
use App\Http\Requests\Patient\GetPatientAvailabilitySlotsRequest;
use App\Models\AppointmentType;
use App\Models\Calendar;
use App\Models\User;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MongoDB\BSON\ObjectId;

class AvailabilitySlotController extends Controller
{
    public function __construct(private AvailabilityService $availabilityService)
    {
    }

    public function feed(GetAvailabilityFeedRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $from = Carbon::parse($data['from'])->utc();
        $to = Carbon::parse($data['to'])->utc();

        $doctorIds = [];
        if (! empty($data['doctorId'])) {
            $doctorIds[] = $data['doctorId'];
        }
        if (! empty($data['doctorIds'])) {
            $doctorIds = array_merge($doctorIds, $data['doctorIds']);
        }
        $doctorIds = array_values(array_unique(array_filter($doctorIds)));

        $calendarIds = $data['calendarIds'] ?? [];

        if (! $this->isAdmin($user)) {
            $doctorIds = [$user->getKey()];
        }

        if (count($doctorIds) === 0 && count($calendarIds) === 0) {
            return response()->json([
                'message' => 'Availability feed loaded',
                'data' => [],
            ]);
        }

        $calendarQuery = Calendar::query()->where('scope', '!=', 'sams');
        if (count($calendarIds) > 0) {
            $calendarQuery->whereIn('_id', $this->parseIds($calendarIds));
        }
        if (count($doctorIds) > 0) {
            $calendarQuery->whereIn('doctorId', $this->parseIds($doctorIds));
        }

        $calendars = $calendarQuery->get();
        if ($calendars->isEmpty()) {
            return response()->json([
                'message' => 'Availability feed loaded',
                'data' => [],
            ]);
        }

        $calendarIdList = $calendars
            ->map(fn (Calendar $calendar) => (string) $calendar->getKey())
            ->filter()
            ->values()
            ->all();

        $appointmentTypes = AppointmentType::query()
            ->whereIn('calendarId', $this->parseIds($calendarIdList))
            ->where('isActive', true)
            ->get();

        $appointmentTypeByCalendar = [];
        foreach ($appointmentTypes as $type) {
            $calendarId = (string) $type->calendarId;
            $length = (int) $type->durationMinutes
                + (int) ($type->bufferBeforeMinutes ?? 0)
                + (int) ($type->bufferAfterMinutes ?? 0);

            if ($length <= 0) {
                continue;
            }

            if (! isset($appointmentTypeByCalendar[$calendarId]) || $length < $appointmentTypeByCalendar[$calendarId]['length']) {
                $appointmentTypeByCalendar[$calendarId] = [
                    'type' => $type,
                    'length' => $length,
                ];
            }
        }

        $slots = [];
        foreach ($calendars as $calendar) {
            $calendarId = (string) $calendar->getKey();
            $doctorId = $calendar->doctorId ? (string) $calendar->doctorId : null;
            if (! $doctorId) {
                continue;
            }

            $typeInfo = $appointmentTypeByCalendar[$calendarId] ?? null;
            if (! $typeInfo) {
                continue;
            }

            $calendarSlots = $this->availabilityService->getSlots(
                $doctorId,
                $calendarId,
                $from,
                $to,
                $typeInfo['type']
            );

            foreach ($calendarSlots as $slot) {
                $slots[] = [
                    'doctorId' => $doctorId,
                    'calendarId' => $calendarId,
                    'startAt' => $slot['startAt'],
                    'endAt' => $slot['endAt'],
                ];
            }
        }

        $deduped = [];
        foreach ($slots as $slot) {
            $key = $slot['doctorId'].'|'.$slot['startAt'].'|'.$slot['endAt'];
            $deduped[$key] = $slot;
        }

        return response()->json([
            'message' => 'Availability feed loaded',
            'data' => array_values($deduped),
        ]);
    }

    public function index(GetAvailabilitySlotsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        if (! $this->isAdmin($user) && $data['doctorId'] !== $user->getKey()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $calendar = Calendar::query()->where('_id', new ObjectId($data['calendarId']))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if ($calendar->doctorId && (string) $calendar->doctorId !== $data['doctorId']) {
            return response()->json([
                'message' => 'Calendar mismatch',
                'errors' => ['calendarId' => ['Calendar does not belong to this doctor']],
            ], 422);
        }

        if (! $this->isAdmin($user)) {
            if ($calendar->scope === 'sams') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            if ((string) $calendar->doctorId !== $user->getKey()) {
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

        $doctorId = $data['doctorId'];
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

        $from = Carbon::parse($data['from'])->utc();
        $to = Carbon::parse($data['to'])->utc();

        $slots = $this->availabilityService->getSlots(
            $doctorId,
            $data['calendarId'],
            $from,
            $to,
            $appointmentType
        );

        return response()->json([
            'message' => 'Availability slots loaded',
            'data' => $slots,
        ]);
    }

    public function patientIndex(GetPatientAvailabilitySlotsRequest $request): JsonResponse
    {
        $data = $request->validated();
        $bookingToken = $request->attributes->get('bookingToken');

        if ($bookingToken && (string) $bookingToken->doctorId !== $data['doctorId']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken && $bookingToken->calendarId && (string) $bookingToken->calendarId !== $data['calendarId']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $calendar = Calendar::query()->where('_id', new ObjectId($data['calendarId']))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if ($calendar->scope === 'sams') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken && $bookingToken->calendarScope && $bookingToken->calendarScope !== $calendar->scope) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken && $bookingToken->specialtyId && (string) $bookingToken->specialtyId !== (string) $calendar->specialtyId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ((string) $calendar->doctorId !== $data['doctorId']) {
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

        if ((string) $appointmentType->doctorId !== $data['doctorId']) {
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

        $from = Carbon::parse($data['from'])->utc();
        $to = Carbon::parse($data['to'])->utc();

        $slots = $this->availabilityService->getSlots(
            $data['doctorId'],
            $data['calendarId'],
            $from,
            $to,
            $appointmentType
        );

        return response()->json([
            'message' => 'Availability slots loaded',
            'data' => $slots,
        ]);
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
}
