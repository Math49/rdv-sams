<?php

namespace App\Http\Controllers\Api\Me;

use App\Http\Controllers\Controller;
use App\Models\Calendar;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use MongoDB\BSON\ObjectId;

class MyCalendarController extends Controller
{
    /**
     * Get calendars belonging to the authenticated doctor.
     * 
     * Returns:
     * - All calendars where doctorId matches the authenticated user
     * - This includes both "doctor" scope and "specialty" scope calendars
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $doctorId = new ObjectId($user->getKey());

        $calendars = Calendar::query()
            ->where('doctorId', $doctorId)
            ->get();

        return response()->json([
            'message' => 'Calendars loaded',
            'data' => $calendars,
        ]);
    }
}
