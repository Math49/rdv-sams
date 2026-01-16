<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetDoctorPasswordRequest;
use App\Http\Requests\Admin\StoreDoctorRequest;
use App\Http\Requests\Admin\UpdateDoctorRequest;
use App\Models\User;
use App\Services\CalendarDeletionService;
use App\Services\DoctorCalendarSyncService;
use Illuminate\Http\JsonResponse;
use MongoDB\BSON\ObjectId;

class DoctorManagementController extends Controller
{
    public function __construct(
        private DoctorCalendarSyncService $calendarSyncService,
        private CalendarDeletionService $calendarDeletionService
    ) {}
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $doctors = User::query()->where('roles', 'doctor')->get();

        return response()->json([
            'message' => 'Doctors loaded',
            'data' => $doctors,
        ]);
    }

    public function store(StoreDoctorRequest $request): JsonResponse
    {
        $data = $request->validated();
        $doctor = User::query()->create([
            'identifier' => $data['identifier'],
            'password' => $data['password'],
            'name' => $data['name'] ?? null,
            'roles' => $data['roles'],
            'specialtyIds' => $data['specialtyIds'] ?? [],
            'isActive' => $data['isActive'] ?? true,
        ]);

        // Create calendars for the new doctor
        $specialtyIds = $data['specialtyIds'] ?? [];
        $this->calendarSyncService->createForNewDoctor((string) $doctor->getKey(), $specialtyIds);

        return response()->json([
            'message' => 'Doctor created',
            'data' => $doctor,
        ]);
    }

    public function show(string $doctorId): JsonResponse
    {
        $doctor = User::query()->where('_id', new ObjectId($doctorId))->first();
        if (! $doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        return response()->json([
            'message' => 'Doctor loaded',
            'data' => $doctor,
        ]);
    }

    public function update(UpdateDoctorRequest $request, string $doctorId): JsonResponse
    {
        $doctor = User::query()->where('_id', new ObjectId($doctorId))->first();
        if (! $doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $validatedData = $request->validated();
        
        // Get old specialty IDs before update
        $oldSpecialtyIds = $doctor->specialtyIds ?? [];

        $doctor->fill($validatedData);
        $doctor->save();

        // Sync calendars if specialtyIds changed
        if (array_key_exists('specialtyIds', $validatedData)) {
            $newSpecialtyIds = $validatedData['specialtyIds'] ?? [];
            $this->calendarSyncService->sync(
                (string) $doctor->getKey(),
                $newSpecialtyIds,
                $oldSpecialtyIds
            );
        }

        return response()->json([
            'message' => 'Doctor updated',
            'data' => $doctor,
        ]);
    }

    public function resetPassword(ResetDoctorPasswordRequest $request, string $doctorId): JsonResponse
    {
        $doctor = User::query()->where('_id', new ObjectId($doctorId))->first();
        if (! $doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $doctor->password = $request->validated()['password'];
        $doctor->save();

        return response()->json([
            'message' => 'Password reset',
            'data' => $doctor,
        ]);
    }

    public function destroy(string $doctorId): JsonResponse
    {
        $doctor = User::query()->where('_id', new ObjectId($doctorId))->first();
        if (! $doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        // Delete all calendars and related data for this doctor
        $this->calendarDeletionService->deleteDoctorCalendarsCascade($doctorId);

        // Delete the doctor user
        $doctor->delete();

        return response()->json([
            'message' => 'Doctor deleted',
            'data' => null,
        ]);
    }
}
