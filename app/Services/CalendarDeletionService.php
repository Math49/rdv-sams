<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\AvailabilityException;
use App\Models\AvailabilityRule;
use App\Models\BookingToken;
use App\Models\Calendar;
use MongoDB\BSON\ObjectId;

class CalendarDeletionService
{
    /**
     * Delete a calendar and all its dependent data in cascade.
     *
     * Deletes in order:
     * 1. Appointments
     * 2. AppointmentTypes
     * 3. AvailabilityRules
     * 4. AvailabilityExceptions
     * 5. BookingTokens (by calendarId)
     * 6. Calendar itself
     */
    public function deleteCalendarCascade(string $calendarId): void
    {
        $objectId = new ObjectId($calendarId);

        // Delete all appointments for this calendar
        Appointment::query()
            ->where('calendarId', $objectId)
            ->delete();

        // Delete all appointment types for this calendar
        AppointmentType::query()
            ->where('calendarId', $objectId)
            ->delete();

        // Delete all availability rules for this calendar
        AvailabilityRule::query()
            ->where('calendarId', $objectId)
            ->delete();

        // Delete all availability exceptions for this calendar
        AvailabilityException::query()
            ->where('calendarId', $objectId)
            ->delete();

        // Delete all booking tokens for this calendar
        BookingToken::query()
            ->where('calendarId', $objectId)
            ->delete();

        // Finally, delete the calendar itself
        Calendar::query()
            ->where('_id', $objectId)
            ->delete();
    }

    /**
     * Delete all calendars for a doctor and their dependent data.
     * Also cleans up any booking tokens linked to the doctor directly.
     */
    public function deleteDoctorCalendarsCascade(string $doctorId): void
    {
        $objectId = new ObjectId($doctorId);

        // Get all calendars belonging to this doctor
        $calendars = Calendar::query()
            ->where('doctorId', $objectId)
            ->get();

        // Delete each calendar in cascade
        foreach ($calendars as $calendar) {
            $this->deleteCalendarCascade((string) $calendar->getKey());
        }

        // Additional cleanup: delete any booking tokens linked to this doctor
        // (in case some were created without a calendarId)
        BookingToken::query()
            ->where('doctorId', $objectId)
            ->delete();

        // Additional safety: delete any appointments where doctorId matches
        // (in case some were not linked via calendarId)
        Appointment::query()
            ->where('doctorId', $objectId)
            ->delete();
    }
}
