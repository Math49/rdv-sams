<?php

use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\AvailabilityException;
use App\Models\AvailabilityRule;
use App\Models\BookingToken;
use App\Models\Calendar;
use App\Models\Specialty;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    // Clean up collections before each test
    Calendar::query()->delete();
    Specialty::query()->delete();
    Appointment::query()->delete();
    AppointmentType::query()->delete();
    AvailabilityRule::query()->delete();
    AvailabilityException::query()->delete();
    BookingToken::query()->delete();
});

/*
|--------------------------------------------------------------------------
| Doctor Creation Tests
|--------------------------------------------------------------------------
*/

test('creating a doctor creates doctor scope calendar', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor1',
        'password' => 'password123',
        'name' => 'Dr. Test',
        'roles' => ['doctor'],
        'specialtyIds' => [],
    ]);

    $response->assertStatus(200);
    $doctorId = $response->json('data._id');

    // Should have created a doctor scope calendar
    $calendars = Calendar::query()->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->get();
    expect($calendars)->toHaveCount(1);
    expect($calendars->first()->scope)->toBe('doctor');
    expect($calendars->first()->label)->toBe('Visite Médicale');
});

test('creating a doctor with specialties creates specialty scope calendars', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    // Create specialties
    $specialty1 = Specialty::create(['code' => 'CARD', 'label' => 'Cardiologie', 'isActive' => true]);
    $specialty2 = Specialty::create(['code' => 'DERM', 'label' => 'Dermatologie', 'isActive' => true]);

    $response = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor2',
        'password' => 'password123',
        'name' => 'Dr. Test',
        'roles' => ['doctor'],
        'specialtyIds' => [(string) $specialty1->getKey(), (string) $specialty2->getKey()],
    ]);

    $response->assertStatus(200);
    $doctorId = $response->json('data._id');

    // Should have created 3 calendars: 1 doctor + 2 specialty
    $calendars = Calendar::query()->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->get();
    expect($calendars)->toHaveCount(3);

    $doctorCal = $calendars->firstWhere('scope', 'doctor');
    expect($doctorCal)->not->toBeNull();

    $specialtyCalendars = $calendars->where('scope', 'specialty');
    expect($specialtyCalendars)->toHaveCount(2);
});

/*
|--------------------------------------------------------------------------
| Doctor Update Tests (Specialty Changes)
|--------------------------------------------------------------------------
*/

test('adding specialty to doctor creates specialty calendar', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    $specialty = Specialty::create(['code' => 'CARD', 'label' => 'Cardiologie', 'isActive' => true]);

    // Create doctor without specialty
    $createResponse = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor3',
        'password' => 'password123',
        'name' => 'Dr. Test',
        'roles' => ['doctor'],
        'specialtyIds' => [],
    ]);

    $doctorId = $createResponse->json('data._id');

    // Initially should have only doctor calendar
    $calendars = Calendar::query()->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->get();
    expect($calendars)->toHaveCount(1);

    // Update doctor to add specialty
    $this->patchJson("/api/admin/doctors/{$doctorId}", [
        'specialtyIds' => [(string) $specialty->getKey()],
    ])->assertStatus(200);

    // Should now have 2 calendars
    $calendars = Calendar::query()->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->get();
    expect($calendars)->toHaveCount(2);
    expect($calendars->where('scope', 'specialty'))->toHaveCount(1);
});

test('removing specialty from doctor deletes specialty calendar and cascade deletes related data', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    $specialty = Specialty::create(['code' => 'CARD', 'label' => 'Cardiologie', 'isActive' => true]);

    // Create doctor with specialty
    $createResponse = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor4',
        'password' => 'password123',
        'name' => 'Dr. Test',
        'roles' => ['doctor'],
        'specialtyIds' => [(string) $specialty->getKey()],
    ]);

    $doctorId = $createResponse->json('data._id');

    // Get the specialty calendar
    $specialtyCalendar = Calendar::query()
        ->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))
        ->where('scope', 'specialty')
        ->first();

    // Create related data for the specialty calendar
    AppointmentType::create([
        'doctorId' => $doctorId,
        'calendarId' => (string) $specialtyCalendar->getKey(),
        'code' => 'TEST',
        'label' => 'Test Appointment',
        'durationMinutes' => 30,
        'isActive' => true,
    ]);

    AvailabilityRule::create([
        'doctorId' => $doctorId,
        'calendarId' => (string) $specialtyCalendar->getKey(),
        'dayOfWeek' => 1,
        'startTime' => '09:00',
        'endTime' => '17:00',
    ]);

    // Verify data exists
    expect(AppointmentType::where('calendarId', $specialtyCalendar->getKey())->count())->toBe(1);
    expect(AvailabilityRule::where('calendarId', $specialtyCalendar->getKey())->count())->toBe(1);

    // Remove specialty from doctor
    $this->patchJson("/api/admin/doctors/{$doctorId}", [
        'specialtyIds' => [],
    ])->assertStatus(200);

    // Specialty calendar should be deleted
    $calendars = Calendar::query()->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->get();
    expect($calendars)->toHaveCount(1);
    expect($calendars->first()->scope)->toBe('doctor');

    // Related data should be cascade deleted
    expect(AppointmentType::where('calendarId', $specialtyCalendar->getKey())->count())->toBe(0);
    expect(AvailabilityRule::where('calendarId', $specialtyCalendar->getKey())->count())->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Doctor Deletion Tests
|--------------------------------------------------------------------------
*/

test('deleting doctor deletes all calendars and cascade deletes all related data', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    $specialty = Specialty::create(['code' => 'CARD', 'label' => 'Cardiologie', 'isActive' => true]);

    // Create doctor with specialty
    $createResponse = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor5',
        'password' => 'password123',
        'name' => 'Dr. Test',
        'roles' => ['doctor'],
        'specialtyIds' => [(string) $specialty->getKey()],
    ]);

    $doctorId = $createResponse->json('data._id');

    // Get calendars
    $calendars = Calendar::query()
        ->where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))
        ->get();

    // Create related data for both calendars
    foreach ($calendars as $calendar) {
        AppointmentType::create([
            'doctorId' => $doctorId,
            'calendarId' => (string) $calendar->getKey(),
            'code' => 'TEST',
            'label' => 'Test',
            'durationMinutes' => 30,
            'isActive' => true,
        ]);

        AvailabilityRule::create([
            'doctorId' => $doctorId,
            'calendarId' => (string) $calendar->getKey(),
            'dayOfWeek' => 1,
            'startTime' => '09:00',
            'endTime' => '17:00',
        ]);

        Appointment::create([
            'doctorId' => $doctorId,
            'calendarId' => (string) $calendar->getKey(),
            'startAt' => now(),
            'endAt' => now()->addHour(),
            'status' => 'confirmed',
        ]);

        BookingToken::create([
            'doctorId' => $doctorId,
            'calendarId' => (string) $calendar->getKey(),
            'expiresAt' => now()->addDay(),
        ]);
    }

    // Verify data exists
    expect(Calendar::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(2);
    expect(AppointmentType::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(2);
    expect(AvailabilityRule::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(2);
    expect(Appointment::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(2);
    expect(BookingToken::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(2);

    // Delete doctor
    $this->deleteJson("/api/admin/doctors/{$doctorId}")->assertStatus(200);

    // All data should be deleted
    expect(Calendar::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(0);
    expect(AppointmentType::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(0);
    expect(AvailabilityRule::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(0);
    expect(Appointment::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(0);
    expect(BookingToken::where('doctorId', new \MongoDB\BSON\ObjectId($doctorId))->count())->toBe(0);

    // Doctor user should be deleted
    expect(User::where('_id', new \MongoDB\BSON\ObjectId($doctorId))->first())->toBeNull();
});

/*
|--------------------------------------------------------------------------
| My Calendars Endpoint Tests
|--------------------------------------------------------------------------
*/

test('GET /api/me/calendars returns only calendars of authenticated doctor', function () {
    // Create two doctors with calendars
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    $specialty = Specialty::create(['code' => 'CARD', 'label' => 'Cardiologie', 'isActive' => true]);

    // Doctor 1
    $response1 = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor6',
        'password' => 'password123',
        'name' => 'Dr. Test 1',
        'roles' => ['doctor'],
        'specialtyIds' => [(string) $specialty->getKey()],
    ]);
    $doctor1Id = $response1->json('data._id');

    // Doctor 2
    $response2 = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor7',
        'password' => 'password123',
        'name' => 'Dr. Test 2',
        'roles' => ['doctor'],
        'specialtyIds' => [],
    ]);
    $doctor2Id = $response2->json('data._id');

    // Act as doctor 1
    $doctor1 = User::find($doctor1Id);
    Sanctum::actingAs($doctor1);

    $response = $this->getJson('/api/me/calendars');
    $response->assertStatus(200);

    $calendars = $response->json('data');
    expect($calendars)->toHaveCount(2); // doctor + specialty

    // All returned calendars should belong to doctor 1
    foreach ($calendars as $calendar) {
        expect($calendar['doctorId'])->toBe($doctor1Id);
    }
});

test('GET /api/me/calendars does not return calendars of other doctors', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    // Create doctor 1 with calendars
    $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor8',
        'password' => 'password123',
        'name' => 'Dr. Test 1',
        'roles' => ['doctor'],
        'specialtyIds' => [],
    ]);

    // Create doctor 2
    $response2 = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctor9',
        'password' => 'password123',
        'name' => 'Dr. Test 2',
        'roles' => ['doctor'],
        'specialtyIds' => [],
    ]);
    $doctor2Id = $response2->json('data._id');

    // Act as doctor 2
    $doctor2 = User::find($doctor2Id);
    Sanctum::actingAs($doctor2);

    $response = $this->getJson('/api/me/calendars');
    $response->assertStatus(200);

    $calendars = $response->json('data');
    expect($calendars)->toHaveCount(1);
    expect($calendars[0]['doctorId'])->toBe($doctor2Id);
});

/*
|--------------------------------------------------------------------------
| Authorization Tests
|--------------------------------------------------------------------------
*/

test('only admin can create doctors', function () {
    $doctor = User::factory()->create(['roles' => ['doctor']]);
    Sanctum::actingAs($doctor);

    $response = $this->postJson('/api/admin/doctors', [
        'identifier' => 'newdoctor',
        'password' => 'password123',
        'name' => 'Dr. New',
        'roles' => ['doctor'],
    ]);

    $response->assertStatus(403);
});

test('only admin can delete doctors', function () {
    $admin = User::factory()->create(['roles' => ['admin']]);
    Sanctum::actingAs($admin);

    $response = $this->postJson('/api/admin/doctors', [
        'identifier' => 'doctortodelete',
        'password' => 'password123',
        'name' => 'Dr. Delete',
        'roles' => ['doctor'],
    ]);

    $doctorId = $response->json('data._id');

    // Act as a non-admin
    $otherDoctor = User::factory()->create(['roles' => ['doctor']]);
    Sanctum::actingAs($otherDoctor);

    $this->deleteJson("/api/admin/doctors/{$doctorId}")->assertStatus(403);
});
