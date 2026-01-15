<?php

namespace App\Services;

use App\Models\Appointment;
use Carbon\CarbonInterface;
use MongoDB\BSON\ObjectId;

class AppointmentService
{
    public function hasOverlap(
        string $doctorId,
        CarbonInterface $startAt,
        CarbonInterface $endAt,
        ?string $ignoreAppointmentId = null
    ): bool
    {
        $query = Appointment::query()
            ->where('doctorId', new ObjectId($doctorId))
            ->where('startAt', '<', $endAt)
            ->where('endAt', '>', $startAt)
            ->whereNotIn('status', ['cancelled', 'canceled']);

        if ($ignoreAppointmentId) {
            $query->where('_id', '!=', new ObjectId($ignoreAppointmentId));
        }

        return $query->exists();
    }
}
