<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\AvailabilityException;
use App\Models\AvailabilityRule;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use MongoDB\BSON\ObjectId;

class AvailabilityService
{
    /**
     * @return array<int, array{startAt: Carbon, endAt: Carbon}>
     */
    public function buildSlots(
        string $doctorId,
        string $calendarId,
        Carbon $from,
        Carbon $to,
        AppointmentType $appointmentType,
        ?string $ignoreAppointmentId = null
    ): array
    {
        $timezone = config('app.timezone', 'Europe/Paris');
        $fromLocal = $from->copy()->setTimezone($timezone);
        $toLocal = $to->copy()->setTimezone($timezone);

        $slotLength = $this->slotLengthMinutes($appointmentType);
        if ($slotLength <= 0) {
            return [];
        }

        $rules = AvailabilityRule::query()
            ->where('doctorId', new ObjectId($doctorId))
            ->where('calendarId', new ObjectId($calendarId))
            ->get();

        $exceptions = AvailabilityException::query()
            ->where('doctorId', new ObjectId($doctorId))
            ->where('calendarId', new ObjectId($calendarId))
            ->whereBetween('date', [$fromLocal->toDateString(), $toLocal->toDateString()])
            ->get();

        $slots = [];

        foreach ($rules as $rule) {
            $periodStart = $fromLocal->copy()->startOfDay();
            $periodEnd = $toLocal->copy()->startOfDay();

            $period = CarbonPeriod::create($periodStart, $periodEnd);

            foreach ($period as $date) {
                if ((int) $date->dayOfWeek !== (int) $rule->dayOfWeek) {
                    continue;
                }

                if ($rule->validFrom && $date->lt($rule->validFrom)) {
                    continue;
                }

                if ($rule->validTo && $date->gt($rule->validTo)) {
                    continue;
                }

                $windowStart = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date->toDateString().' '.$rule->startTime,
                    $timezone
                );
                $windowEnd = Carbon::createFromFormat(
                    'Y-m-d H:i',
                    $date->toDateString().' '.$rule->endTime,
                    $timezone
                );

                $stepMinutes = (int) $rule->slotMinutes;
                if ($stepMinutes <= 0) {
                    continue;
                }

                $slotStart = $windowStart->copy();
                while ($slotStart->copy()->addMinutes($slotLength)->lte($windowEnd)) {
                    $slotEnd = $slotStart->copy()->addMinutes($slotLength);

                    if ($slotStart->lt($fromLocal) || $slotEnd->gt($toLocal)) {
                        $slotStart->addMinutes($stepMinutes);
                        continue;
                    }

                    $slots[] = [
                        'startAt' => $slotStart->copy(),
                        'endAt' => $slotEnd->copy(),
                    ];

                    $slotStart->addMinutes($stepMinutes);
                }
            }
        }

        $slots = $this->applyExceptions($slots, $exceptions, $slotLength);
        $slots = $this->removeOverlapsWithAppointments($slots, $doctorId, $fromLocal, $toLocal, $ignoreAppointmentId);

        return $this->dedupeAndSort($slots);
    }

    /**
     * @return array<int, array{startAt: string, endAt: string}>
     */
    public function getSlots(string $doctorId, string $calendarId, Carbon $from, Carbon $to, AppointmentType $appointmentType): array
    {
        return array_map(
            fn (array $slot) => [
                'startAt' => $slot['startAt']->toIso8601String(),
                'endAt' => $slot['endAt']->toIso8601String(),
            ],
            $this->buildSlots($doctorId, $calendarId, $from, $to, $appointmentType)
        );
    }

    public function isSlotAvailable(
        string $doctorId,
        string $calendarId,
        Carbon $startAt,
        AppointmentType $appointmentType,
        ?string $ignoreAppointmentId = null
    ): bool
    {
        $slotLength = $this->slotLengthMinutes($appointmentType);
        if ($slotLength <= 0) {
            return false;
        }

        $endAt = $startAt->copy()->addMinutes($slotLength);
        $slots = $this->buildSlots($doctorId, $calendarId, $startAt, $endAt, $appointmentType, $ignoreAppointmentId);
        $timezone = config('app.timezone', 'Europe/Paris');
        $startAtLocal = $startAt->copy()->setTimezone($timezone);
        $endAtLocal = $endAt->copy()->setTimezone($timezone);

        foreach ($slots as $slot) {
            if ($slot['startAt']->equalTo($startAtLocal) && $slot['endAt']->equalTo($endAtLocal)) {
                return true;
            }
        }

        return false;
    }

    private function slotLengthMinutes(AppointmentType $appointmentType): int
    {
        return (int) $appointmentType->durationMinutes
            + (int) ($appointmentType->bufferBeforeMinutes ?? 0)
            + (int) ($appointmentType->bufferAfterMinutes ?? 0);
    }

    /**
     * @param array<int, array{startAt: Carbon, endAt: Carbon}> $slots
     * @return array<int, array{startAt: Carbon, endAt: Carbon}>
     */
    private function applyExceptions(array $slots, $exceptions, int $slotLength): array
    {
        $timezone = config('app.timezone', 'Europe/Paris');

        foreach ($exceptions as $exception) {
            if (! $exception->date || ! $exception->startTime || ! $exception->endTime) {
                continue;
            }

            $start = Carbon::createFromFormat(
                'Y-m-d H:i',
                $exception->date->toDateString().' '.$exception->startTime,
                $timezone
            );
            $end = Carbon::createFromFormat(
                'Y-m-d H:i',
                $exception->date->toDateString().' '.$exception->endTime,
                $timezone
            );

            if ($exception->kind === 'add') {
                $slotStart = $start->copy();
                while ($slotStart->copy()->addMinutes($slotLength)->lte($end)) {
                    $slotEnd = $slotStart->copy()->addMinutes($slotLength);
                    $slots[] = [
                        'startAt' => $slotStart->copy(),
                        'endAt' => $slotEnd->copy(),
                    ];
                    $slotStart->addMinutes($slotLength);
                }
                continue;
            }

            $slots = array_values(array_filter($slots, function (array $slot) use ($start, $end) {
                return ! ($slot['startAt']->lt($end) && $slot['endAt']->gt($start));
            }));
        }

        return $slots;
    }

    /**
     * @param array<int, array{startAt: Carbon, endAt: Carbon}> $slots
     * @return array<int, array{startAt: Carbon, endAt: Carbon}>
     */
    private function removeOverlapsWithAppointments(
        array $slots,
        string $doctorId,
        Carbon $from,
        Carbon $to,
        ?string $ignoreAppointmentId = null
    ): array
    {
        $appointmentsQuery = Appointment::query()
            ->where('doctorId', new ObjectId($doctorId))
            ->where('startAt', '<', $to)
            ->where('endAt', '>', $from)
            ->whereNotIn('status', ['cancelled', 'canceled']);

        if ($ignoreAppointmentId) {
            $appointmentsQuery->where('_id', '!=', new ObjectId($ignoreAppointmentId));
        }

        $appointments = $appointmentsQuery->get();

        return array_values(array_filter($slots, function (array $slot) use ($appointments) {
            foreach ($appointments as $appointment) {
                if ($appointment->startAt < $slot['endAt'] && $appointment->endAt > $slot['startAt']) {
                    return false;
                }
            }

            return true;
        }));
    }

    /**
     * @param array<int, array{startAt: Carbon, endAt: Carbon}> $slots
     * @return array<int, array{startAt: Carbon, endAt: Carbon}>
     */
    private function dedupeAndSort(array $slots): array
    {
        $deduped = [];

        foreach ($slots as $slot) {
            $key = $slot['startAt']->format('c').'-'.$slot['endAt']->format('c');
            $deduped[$key] = $slot;
        }

        $slots = array_values($deduped);

        usort($slots, function (array $a, array $b) {
            return $a['startAt']->getTimestamp() <=> $b['startAt']->getTimestamp();
        });

        return $slots;
    }
}
