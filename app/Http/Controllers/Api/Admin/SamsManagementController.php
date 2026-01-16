<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSamsEventRequest;
use App\Http\Requests\Admin\UpdateSamsEventRequest;
use App\Models\SamsEvent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use MongoDB\BSON\ObjectId;

class SamsManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'SAMS events loaded',
            'data' => SamsEvent::query()->get(),
        ]);
    }

    public function store(StoreSamsEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $event = SamsEvent::query()->create([
            'title' => $data['title'],
            'startAt' => Carbon::parse($data['startAt']),
            'endAt' => Carbon::parse($data['endAt']),
            'location' => $data['location'] ?? null,
            'description' => $data['description'] ?? null,
            'source' => $data['source'] ?? null,
        ]);

        return response()->json([
            'message' => 'SAMS event created',
            'data' => $event,
        ]);
    }

    public function update(UpdateSamsEventRequest $request, string $id): JsonResponse
    {
        $event = SamsEvent::query()->where('_id', new ObjectId($id))->first();
        if (! $event) {
            return response()->json(['message' => 'SAMS event not found'], 404);
        }

        $data = $request->validated();
        if (isset($data['startAt'])) {
            $data['startAt'] = Carbon::parse($data['startAt']);
        }
        if (isset($data['endAt'])) {
            $data['endAt'] = Carbon::parse($data['endAt']);
        }

        $event->fill($data);
        $event->save();

        return response()->json([
            'message' => 'SAMS event updated',
            'data' => $event,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $event = SamsEvent::query()->where('_id', new ObjectId($id))->first();
        if (! $event) {
            return response()->json(['message' => 'SAMS event not found'], 404);
        }

        $event->delete();

        return response()->json([
            'message' => 'SAMS event deleted',
            'data' => null,
        ]);
    }
}
