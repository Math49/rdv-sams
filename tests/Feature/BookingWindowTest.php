<?php

use App\Models\AppointmentType;
use App\Models\BookingToken;
use App\Models\Calendar;
use App\Models\User;
use Carbon\Carbon;
use function Pest\Laravel\{patchJson, postJson, getJson};

beforeEach(function () {
    $this->doctor = User::query()->create([
        'identifier' => 'doc-booking-window-test',
        'password' => bcrypt('password'),
        'roles' => ['doctor'],
        'isActive' => true,
    ]);

    $this->calendar = Calendar::query()->create([
        'scope' => 'doctor',
        'doctorId' => (string) $this->doctor->getKey(),
        'label' => 'Booking Window Test Calendar',
        'isActive' => true,
        'bookingMinHours' => 24,
        'bookingMaxDays' => 7,
    ]);

    $this->appointmentType = AppointmentType::query()->create([
        'doctorId' => (string) $this->doctor->getKey(),
        'calendarId' => (string) $this->calendar->getKey(),
        'code' => 'TEST',
        'label' => 'Test Appointment',
        'durationMinutes' => 30,
        'isActive' => true,
    ]);

    $this->bookingToken = BookingToken::query()->create([
        'doctorId' => (string) $this->doctor->getKey(),
        'calendarId' => (string) $this->calendar->getKey(),
        'tokenHash' => hash('sha256', 'TESTTOKEN1'),
        'expiresAt' => now()->addHours(2),
        'usedAt' => null,
    ]);
});

afterEach(function () {
    BookingToken::query()->where('doctorId', (string) $this->doctor->getKey())->delete();
    AppointmentType::query()->where('doctorId', (string) $this->doctor->getKey())->delete();
    Calendar::query()->where('doctorId', (string) $this->doctor->getKey())->delete();
    User::query()->where('identifier', 'doc-booking-window-test')->delete();
});

describe('Calendar Booking Window Configuration', function () {
    it('updates booking window via PATCH', function () {
        $response = $this->actingAs($this->doctor)
            ->patchJson("/api/calendars/{$this->calendar->getKey()}/booking-window", [
                'bookingMinHours' => 4,
                'bookingMaxDays' => 30,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.bookingMinHours', 4)
            ->assertJsonPath('data.bookingMaxDays', 30);

        $this->calendar->refresh();
        expect($this->calendar->bookingMinHours)->toBe(4);
        expect($this->calendar->bookingMaxDays)->toBe(30);
    });

    it('validates booking window min/max values', function () {
        $response = $this->actingAs($this->doctor)
            ->patchJson("/api/calendars/{$this->calendar->getKey()}/booking-window", [
                'bookingMinHours' => -1,
                'bookingMaxDays' => 0,
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['bookingMinHours', 'bookingMaxDays']);
    });

    it('validates booking window max limits', function () {
        $response = $this->actingAs($this->doctor)
            ->patchJson("/api/calendars/{$this->calendar->getKey()}/booking-window", [
                'bookingMinHours' => 1000,
                'bookingMaxDays' => 1000,
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['bookingMinHours', 'bookingMaxDays']);
    });
});

describe('Patient Slots Endpoint with Booking Window', function () {
    it('returns booking window in response', function () {
        $from = now()->addDays(2)->startOfDay()->toIso8601String();
        $to = now()->addDays(3)->endOfDay()->toIso8601String();

        $response = $this->withCookies(['patient_token' => (string) $this->bookingToken->getKey()])
            ->getJson('/api/patient/availability/slots?' . http_build_query([
                'doctorId' => (string) $this->doctor->getKey(),
                'calendarId' => (string) $this->calendar->getKey(),
                'appointmentTypeId' => (string) $this->appointmentType->getKey(),
                'from' => $from,
                'to' => $to,
            ]));

        $response->assertOk()
            ->assertJsonStructure(['data', 'bookingWindow' => ['minStart', 'maxStart']]);
    });

    it('does not return slots before minStart', function () {
        // Calendar has bookingMinHours = 24
        // Request slots for the next 2 hours (should be empty or filtered)
        $from = now()->toIso8601String();
        $to = now()->addHours(2)->toIso8601String();

        $response = $this->withCookies(['patient_token' => (string) $this->bookingToken->getKey()])
            ->getJson('/api/patient/availability/slots?' . http_build_query([
                'doctorId' => (string) $this->doctor->getKey(),
                'calendarId' => (string) $this->calendar->getKey(),
                'appointmentTypeId' => (string) $this->appointmentType->getKey(),
                'from' => $from,
                'to' => $to,
            ]));

        $response->assertOk();
        // Data should be empty since all slots are before minStart (now + 24h)
        $slots = $response->json('data');
        $minStart = Carbon::parse($response->json('bookingWindow.minStart'));

        foreach ($slots as $slot) {
            $slotStart = Carbon::parse($slot['startAt']);
            expect($slotStart->gte($minStart))->toBeTrue();
        }
    });
});

describe('Patient Appointment Creation with Booking Window', function () {
    it('rejects appointment before minStart', function () {
        // Try to book an appointment in 1 hour (before minStart of 24 hours)
        $startAt = now()->addHour()->toIso8601String();

        $response = $this->withCookies(['patient_token' => (string) $this->bookingToken->getKey()])
            ->postJson('/api/patient/appointments', [
                'calendarId' => (string) $this->calendar->getKey(),
                'appointmentTypeId' => (string) $this->appointmentType->getKey(),
                'startAt' => $startAt,
                'patient' => [
                    'lastname' => 'Test',
                    'firstname' => 'Patient',
                    'phone' => '0123456789',
                ],
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['startAt']);

        expect($response->json('errors.startAt.0'))->toContain('partir du');
    });

    it('rejects appointment after maxStart', function () {
        // Try to book an appointment in 30 days (after maxStart of 7 days)
        $startAt = now()->addDays(30)->toIso8601String();

        $response = $this->withCookies(['patient_token' => (string) $this->bookingToken->getKey()])
            ->postJson('/api/patient/appointments', [
                'calendarId' => (string) $this->calendar->getKey(),
                'appointmentTypeId' => (string) $this->appointmentType->getKey(),
                'startAt' => $startAt,
                'patient' => [
                    'lastname' => 'Test',
                    'firstname' => 'Patient',
                    'phone' => '0123456789',
                ],
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['startAt']);

        expect($response->json('errors.startAt.0'))->toContain("jusqu'au");
    });
});
