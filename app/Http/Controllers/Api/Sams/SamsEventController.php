<?php

namespace App\Http\Controllers\Api\Sams;

use App\Http\Controllers\Controller;
use App\Models\SamsEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SamsEventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = SamsEvent::query();
        if ($from = $request->query('from')) {
            $query->where('startAt', '>=', Carbon::parse($from));
        }
        if ($to = $request->query('to')) {
            $query->where('startAt', '<=', Carbon::parse($to));
        }

        return response()->json([
            'message' => 'SAMS events loaded',
            'data' => $query->get(),
        ]);
    }
}
