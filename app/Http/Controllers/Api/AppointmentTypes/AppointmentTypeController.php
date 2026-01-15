<?php

namespace App\Http\Controllers\Api\AppointmentTypes;

use App\Http\Controllers\Controller;
use App\Http\Requests\AppointmentTypes\StoreAppointmentTypeRequest;
use App\Http\Requests\AppointmentTypes\UpdateAppointmentTypeRequest;
use App\Models\AppointmentType;
use App\Models\Calendar;
use App\Models\BookingToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use MongoDB\BSON\ObjectId;

class AppointmentTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, string $calendarId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $calendar = Calendar::query()->where('_id', new ObjectId($calendarId))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if (! $this->isAdmin($user)) {
            if ($calendar->scope === 'sams') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $calendarDoctorId = $calendar->doctorId ? (string) $calendar->doctorId : null;
            $hasSpecialty = $calendar->specialtyId
                ? in_array((string) $calendar->specialtyId, $user->specialtyIds ?? [], true)
                : false;

            if ($calendarDoctorId !== $user->getKey() && ! $hasSpecialty) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $query = AppointmentType::query()->where('calendarId', new ObjectId($calendarId));
        if (! $this->isAdmin($user)) {
            $query->where('doctorId', new ObjectId($user->getKey()));
        }

        return response()->json([
            'message' => 'Appointment types loaded',
            'data' => $query->get(),
        ]);
    }

    public function patientIndex(Request $request, string $calendarId): JsonResponse
    {
        /** @var BookingToken|null $bookingToken */
        $bookingToken = $request->attributes->get('bookingToken');
        if (! $bookingToken) {
            return response()->json(['message' => 'Patient token required'], 401);
        }

        $calendar = Calendar::query()->where('_id', new ObjectId($calendarId))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if ($calendar->scope === 'sams') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $doctorId = $bookingToken->doctorId ? (string) $bookingToken->doctorId : null;
        if ($calendar->doctorId && $doctorId && (string) $calendar->doctorId !== $doctorId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken->calendarId && (string) $bookingToken->calendarId !== $calendarId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($bookingToken->specialtyId && $calendar->specialtyId) {
            if ((string) $calendar->specialtyId !== (string) $bookingToken->specialtyId) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $query = AppointmentType::query()
            ->where('calendarId', new ObjectId($calendarId))
            ->where('isActive', true);

        return response()->json([
            'message' => 'Appointment types loaded',
            'data' => $query->get(),
        ]);
    }

    public function store(StoreAppointmentTypeRequest $request, string $calendarId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $calendar = Calendar::query()->where('_id', new ObjectId($calendarId))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        if (! $this->isAdmin($user)) {
            if ($calendar->scope === 'sams') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            $calendarDoctorId = $calendar->doctorId ? (string) $calendar->doctorId : null;
            $hasSpecialty = $calendar->specialtyId
                ? in_array((string) $calendar->specialtyId, $user->specialtyIds ?? [], true)
                : false;

            if ($calendarDoctorId !== $user->getKey() && ! $hasSpecialty) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $data = $request->validated();
        $doctorId = $this->isAdmin($user)
            ? ($data['doctorId'] ?? ($calendar->doctorId ? (string) $calendar->doctorId : null))
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

        $code = $this->generateUniqueCode($data['label'], $doctorId, $calendarId);

        $appointmentType = AppointmentType::query()->create([
            'doctorId' => $doctorId,
            'calendarId' => $calendarId,
            'specialtyId' => $data['specialtyId'] ?? $calendar->specialtyId,
            'code' => $code,
            'label' => $data['label'],
            'durationMinutes' => $data['durationMinutes'],
            'bufferBeforeMinutes' => $data['bufferBeforeMinutes'] ?? 0,
            'bufferAfterMinutes' => $data['bufferAfterMinutes'] ?? 0,
            'isActive' => $data['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Appointment type created',
            'data' => $appointmentType,
        ]);
    }

    public function update(UpdateAppointmentTypeRequest $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $appointmentType = AppointmentType::query()->where('_id', new ObjectId($id))->first();
        if (! $appointmentType) {
            return response()->json(['message' => 'Appointment type not found'], 404);
        }

        if (! $this->isAdmin($user) && (string) $appointmentType->doctorId !== $user->getKey()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validated();
        $appointmentType->fill($data);
        if (array_key_exists('label', $data) && $data['label'] !== $appointmentType->getOriginal('label')) {
            $appointmentType->code = $this->generateUniqueCode(
                $data['label'],
                (string) $appointmentType->doctorId,
                (string) $appointmentType->calendarId,
                $id
            );
        }
        $appointmentType->save();

        return response()->json([
            'message' => 'Appointment type updated',
            'data' => $appointmentType,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $appointmentType = AppointmentType::query()->where('_id', new ObjectId($id))->first();
        if (! $appointmentType) {
            return response()->json(['message' => 'Appointment type not found'], 404);
        }

        if (! $this->isAdmin($user) && (string) $appointmentType->doctorId !== $user->getKey()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $appointmentType->delete();

        return response()->json([
            'message' => 'Appointment type deleted',
            'data' => null,
        ]);
    }

    private function generateUniqueCode(string $label, string $doctorId, string $calendarId, ?string $ignoreId = null): string
    {
        $base = Str::slug($label);
        if ($base === '') {
            $base = 'type';
        }

        $code = $base;
        $suffix = 2;

        while ($this->codeExists($code, $doctorId, $calendarId, $ignoreId)) {
            $code = $base.'-'.$suffix;
            $suffix++;
        }

        return $code;
    }

    private function codeExists(string $code, string $doctorId, string $calendarId, ?string $ignoreId = null): bool
    {
        $query = AppointmentType::query()
            ->where('doctorId', new ObjectId($doctorId))
            ->where('calendarId', new ObjectId($calendarId))
            ->where('code', $code);

        if ($ignoreId) {
            $query->where('_id', '!=', new ObjectId($ignoreId));
        }

        return $query->exists();
    }
}
