<?php

namespace App\Http\Controllers\Api\Calendars;

use App\Http\Controllers\Controller;
use App\Http\Requests\Calendars\UpdateCalendarBookingWindowRequest;
use App\Http\Requests\Calendars\UpdateCalendarMessageRequest;
use App\Models\Calendar;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MongoDB\BSON\ObjectId;

class CalendarController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($this->isAdmin($user)) {
            $calendars = Calendar::query()->get();

            return response()->json([
                'message' => 'Calendars loaded',
                'data' => $calendars,
            ]);
        }

        $doctorId = new ObjectId($user->getKey());
        $doctorCalendars = Calendar::query()
            ->where('scope', 'doctor')
            ->where('doctorId', $doctorId)
            ->get();

        $specialtyCalendars = collect();
        if (count($user->specialtyIds ?? []) > 0) {
            $specialtyIds = array_map(fn (string $id) => new ObjectId($id), $user->specialtyIds);
            $specialtyCalendars = Calendar::query()
                ->where('scope', 'specialty')
                ->whereIn('specialtyId', $specialtyIds)
                ->get();
        }

        $samsCalendars = Calendar::query()
            ->where('scope', 'sams')
            ->get();

        $calendars = $doctorCalendars
            ->concat($specialtyCalendars)
            ->concat($samsCalendars)
            ->values();

        return response()->json([
            'message' => 'Calendars loaded',
            'data' => $calendars,
        ]);
    }

    public function patientIndex(Request $request, string $doctorId): JsonResponse
    {
        $bookingToken = $request->attributes->get('bookingToken');
        if ($bookingToken && (string) $bookingToken->doctorId !== $doctorId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $doctor = User::query()->where('_id', new ObjectId($doctorId))->first();
        if (! $doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $doctorCalendars = Calendar::query()
            ->where('scope', 'doctor')
            ->where('doctorId', new ObjectId($doctorId))
            ->where('isActive', true)
            ->get();

        $specialtyCalendars = collect();
        if (count($doctor->specialtyIds ?? []) > 0) {
            $specialtyIds = array_map(fn (string $id) => new ObjectId($id), $doctor->specialtyIds);
            $specialtyCalendars = Calendar::query()
                ->where('scope', 'specialty')
                ->whereIn('specialtyId', $specialtyIds)
                ->where('isActive', true)
                ->get();
        }

        $calendars = $doctorCalendars->concat($specialtyCalendars)->values();

        if ($bookingToken) {
            if ($bookingToken->calendarId) {
                $calendarId = (string) $bookingToken->calendarId;
                $calendars = $calendars->filter(fn (Calendar $calendar) => (string) $calendar->getKey() === $calendarId);
            }

            if ($bookingToken->calendarScope) {
                $calendars = $calendars->filter(fn (Calendar $calendar) => $calendar->scope === $bookingToken->calendarScope);
            }

            if ($bookingToken->specialtyId) {
                $specialtyId = (string) $bookingToken->specialtyId;
                // Only filter by specialtyId for specialty scope calendars
                // Doctor scope calendars don't have a specialtyId
                $calendars = $calendars->filter(fn (Calendar $calendar) => 
                    $calendar->scope === 'doctor' || (string) $calendar->specialtyId === $specialtyId
                );
            }

            $calendars = $calendars->values();
        }

        return response()->json([
            'message' => 'Calendars loaded',
            'data' => $calendars,
        ]);
    }

    public function updateMessage(UpdateCalendarMessageRequest $request, string $calendarId): JsonResponse
    {
        $calendar = Calendar::query()->where('_id', new ObjectId($calendarId))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $this->isAdmin($user)) {
            if ($calendar->scope === 'sams') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            if ((string) $calendar->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $data = $request->validated();
        $calendar->message = $data['message'];
        if (array_key_exists('color', $data)) {
            $calendar->color = $data['color'];
        }
        $calendar->save();

        return response()->json([
            'message' => 'Calendar message updated',
            'data' => $calendar,
        ]);
    }

    public function updateBookingWindow(UpdateCalendarBookingWindowRequest $request, string $calendarId): JsonResponse
    {
        $calendar = Calendar::query()->where('_id', new ObjectId($calendarId))->first();
        if (! $calendar) {
            return response()->json(['message' => 'Calendar not found'], 404);
        }

        /** @var User $user */
        $user = $request->user();
        if (! $this->isAdmin($user)) {
            if ($calendar->scope === 'sams') {
                return response()->json(['message' => 'Forbidden'], 403);
            }

            if ((string) $calendar->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $data = $request->validated();
        $calendar->bookingMinHours = (int) $data['bookingMinHours'];
        $calendar->bookingMaxDays = (int) $data['bookingMaxDays'];
        $calendar->save();

        return response()->json([
            'message' => 'Booking window updated',
            'data' => $calendar,
        ]);
    }
}
