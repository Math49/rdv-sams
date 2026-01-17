<?php

namespace App\Services;

use App\Models\Calendar;
use App\Models\Specialty;
use MongoDB\BSON\ObjectId;

class DoctorCalendarSyncService
{
    public function __construct(
        private CalendarDeletionService $calendarDeletionService
    ) {}

    /**
     * Synchronize calendars for a doctor based on their specialty IDs.
     * 
     * This will:
     * 1. Ensure a "doctor" scope calendar exists for the doctor
     * 2. Create "specialty" scope calendars for each specialty
     * 3. Delete "specialty" scope calendars for removed specialties (with cascade)
     *
     * @param string $doctorId The doctor's user ID
     * @param array<string> $newSpecialtyIds The new specialty IDs to sync
     * @param array<string>|null $oldSpecialtyIds The old specialty IDs (null for new doctor)
     */
    public function sync(string $doctorId, array $newSpecialtyIds, ?array $oldSpecialtyIds = null): void
    {
        $doctorObjectId = new ObjectId($doctorId);

        // 1. Ensure doctor scope calendar exists
        $this->ensureDoctorCalendar($doctorObjectId);

        // 2. Calculate diff for specialty calendars
        $oldIds = $oldSpecialtyIds !== null ? array_map('strval', $oldSpecialtyIds) : [];
        $newIds = array_map('strval', $newSpecialtyIds);

        $added = array_diff($newIds, $oldIds);
        $removed = array_diff($oldIds, $newIds);

        // 3. Create calendars for added specialties
        foreach ($added as $specialtyId) {
            $this->ensureSpecialtyCalendar($doctorObjectId, $specialtyId);
        }

        // 4. Delete calendars for removed specialties (cascade)
        foreach ($removed as $specialtyId) {
            $this->deleteSpecialtyCalendar($doctorId, $specialtyId);
        }
    }

    /**
     * Create all calendars for a new doctor.
     *
     * @param string $doctorId The doctor's user ID
     * @param array<string> $specialtyIds The specialty IDs
     */
    public function createForNewDoctor(string $doctorId, array $specialtyIds): void
    {
        $this->sync($doctorId, $specialtyIds, []);
    }

    /**
     * Ensure the doctor scope calendar exists.
     */
    private function ensureDoctorCalendar(ObjectId $doctorId): Calendar
    {
        $existing = Calendar::query()
            ->where('scope', 'doctor')
            ->where('doctorId', $doctorId)
            ->first();

        if ($existing) {
            return $existing;
        }

        return Calendar::query()->create([
            'scope' => 'doctor',
            'doctorId' => (string) $doctorId,
            'label' => 'Médical',
            'isActive' => true,
        ]);
    }

    /**
     * Ensure a specialty scope calendar exists for the given doctor and specialty.
     */
    private function ensureSpecialtyCalendar(ObjectId $doctorId, string $specialtyId): Calendar
    {
        $specialtyObjectId = new ObjectId($specialtyId);

        $existing = Calendar::query()
            ->where('scope', 'specialty')
            ->where('doctorId', $doctorId)
            ->where('specialtyId', $specialtyObjectId)
            ->first();

        if ($existing) {
            return $existing;
        }

        // Try to get the specialty label
        $specialty = Specialty::query()->where('_id', $specialtyObjectId)->first();
        $label = $specialty?->label ?? 'Spécialité';

        return Calendar::query()->create([
            'scope' => 'specialty',
            'doctorId' => (string) $doctorId,
            'specialtyId' => $specialtyId,
            'label' => $label,
            'isActive' => true,
        ]);
    }

    /**
     * Delete the specialty calendar for a doctor (with cascade).
     */
    private function deleteSpecialtyCalendar(string $doctorId, string $specialtyId): void
    {
        $doctorObjectId = new ObjectId($doctorId);
        $specialtyObjectId = new ObjectId($specialtyId);

        $calendar = Calendar::query()
            ->where('scope', 'specialty')
            ->where('doctorId', $doctorObjectId)
            ->where('specialtyId', $specialtyObjectId)
            ->first();

        if ($calendar) {
            $this->calendarDeletionService->deleteCalendarCascade((string) $calendar->getKey());
        }
    }
}
