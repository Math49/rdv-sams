<?php

namespace App\Http\Controllers\Api\Availability;

use App\Http\Controllers\Controller;
use App\Http\Requests\Availability\StoreAvailabilityRuleRequest;
use App\Http\Requests\Availability\UpdateAvailabilityRuleRequest;
use App\Models\AvailabilityRule;
use App\Models\Calendar;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MongoDB\BSON\ObjectId;

class AvailabilityRuleController extends Controller
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

            if ((string) $calendar->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $query = AvailabilityRule::query()->where('calendarId', new ObjectId($calendarId));
        if (! $this->isAdmin($user)) {
            $query->where('doctorId', new ObjectId($user->getKey()));
        }

        return response()->json([
            'message' => 'Availability rules loaded',
            'data' => $query->get(),
        ]);
    }

    public function store(StoreAvailabilityRuleRequest $request, string $calendarId): JsonResponse
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

            if ((string) $calendar->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $doctorId = $this->isAdmin($user) ? (string) $calendar->doctorId : $user->getKey();
        if (! $doctorId) {
            return response()->json([
                'message' => 'Doctor required',
                'errors' => ['doctorId' => ['Doctor is required']],
            ], 422);
        }

        $data = $request->validated();
        $payload = [
            'doctorId' => $doctorId,
            'calendarId' => $calendarId,
            'dayOfWeek' => $data['dayOfWeek'],
            'startTime' => $data['startTime'],
            'endTime' => $data['endTime'],
            'slotMinutes' => $data['slotMinutes'],
            'validFrom' => $data['validFrom'] ?? null,
            'validTo' => $data['validTo'] ?? null,
            'timezone' => config('app.timezone', 'Europe/Paris'),
        ];

        $rule = AvailabilityRule::query()->create($payload);

        return response()->json([
            'message' => 'Availability rule created',
            'data' => $rule,
        ]);
    }

    public function update(UpdateAvailabilityRuleRequest $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $rule = AvailabilityRule::query()->where('_id', new ObjectId($id))->first();
        if (! $rule) {
            return response()->json(['message' => 'Availability rule not found'], 404);
        }

        if (! $this->isAdmin($user)) {
            if ((string) $rule->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $data = $request->validated();
        $data['timezone'] = config('app.timezone', 'Europe/Paris');
        $rule->fill($data);
        $rule->save();

        return response()->json([
            'message' => 'Availability rule updated',
            'data' => $rule,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $rule = AvailabilityRule::query()->where('_id', new ObjectId($id))->first();
        if (! $rule) {
            return response()->json(['message' => 'Availability rule not found'], 404);
        }

        if (! $this->isAdmin($user)) {
            if ((string) $rule->doctorId !== $user->getKey()) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        $rule->delete();

        return response()->json([
            'message' => 'Availability rule deleted',
            'data' => null,
        ]);
    }
}
