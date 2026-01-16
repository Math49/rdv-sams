<?php

use App\Http\Controllers\Api\Admin\AppointmentManagementController;
use App\Http\Controllers\Api\Admin\DoctorManagementController;
use App\Http\Controllers\Api\Admin\SamsManagementController;
use App\Http\Controllers\Api\Admin\SpecialtyManagementController;
use App\Http\Controllers\Api\AppointmentTypes\AppointmentTypeController;
use App\Http\Controllers\Api\Appointments\AppointmentController;
use App\Http\Controllers\Api\Appointments\AppointmentTransferController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Availability\AvailabilityExceptionController;
use App\Http\Controllers\Api\Availability\AvailabilityRuleController;
use App\Http\Controllers\Api\Availability\AvailabilitySlotController;
use App\Http\Controllers\Api\BookingTokens\BookingTokenController;
use App\Http\Controllers\Api\Calendars\CalendarController;
use App\Http\Controllers\Api\Doctors\DoctorController;
use App\Http\Controllers\Api\Me\MyCalendarController;
use App\Http\Controllers\Api\Patient\PatientTokenController;
use App\Http\Controllers\Api\Sams\SamsEventController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [LoginController::class, 'store']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [MeController::class, 'index']);
        Route::post('logout', [LogoutController::class, 'store']);
    });
});

Route::prefix('patient')->group(function () {
    Route::post('token/validate', [PatientTokenController::class, 'store']);

    Route::middleware('patient.token')->group(function () {
        Route::get('context', [PatientTokenController::class, 'context']);
        Route::get('doctors/{doctorId}', [DoctorController::class, 'showPatient']);
        Route::get('doctors/{doctorId}/calendars', [CalendarController::class, 'patientIndex']);
        Route::get('calendars/{calendarId}/appointment-types', [AppointmentTypeController::class, 'patientIndex']);
        Route::get('availability/slots', [AvailabilitySlotController::class, 'patientIndex']);
        Route::post('appointments', [AppointmentController::class, 'storePatient']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('me/calendars', [MyCalendarController::class, 'index']);

    Route::get('doctors', [DoctorController::class, 'index']);
    Route::get('doctors/{doctorId}', [DoctorController::class, 'show']);

    Route::get('calendars', [CalendarController::class, 'index']);
    Route::patch('calendars/{calendarId}/message', [CalendarController::class, 'updateMessage']);

    Route::get('calendars/{calendarId}/appointment-types', [AppointmentTypeController::class, 'index']);
    Route::post('calendars/{calendarId}/appointment-types', [AppointmentTypeController::class, 'store']);
    Route::patch('appointment-types/{id}', [AppointmentTypeController::class, 'update']);
    Route::delete('appointment-types/{id}', [AppointmentTypeController::class, 'destroy']);

    Route::get('calendars/{calendarId}/availability-rules', [AvailabilityRuleController::class, 'index']);
    Route::post('calendars/{calendarId}/availability-rules', [AvailabilityRuleController::class, 'store']);
    Route::patch('availability-rules/{id}', [AvailabilityRuleController::class, 'update']);
    Route::delete('availability-rules/{id}', [AvailabilityRuleController::class, 'destroy']);

    Route::get('calendars/{calendarId}/availability-exceptions', [AvailabilityExceptionController::class, 'index']);
    Route::post('calendars/{calendarId}/availability-exceptions', [AvailabilityExceptionController::class, 'store']);
    Route::patch('availability-exceptions/{id}', [AvailabilityExceptionController::class, 'update']);
    Route::delete('availability-exceptions/{id}', [AvailabilityExceptionController::class, 'destroy']);

    Route::get('availability/slots', [AvailabilitySlotController::class, 'index']);
    Route::get('availability/feed', [AvailabilitySlotController::class, 'feed']);

    Route::post('calendars/{calendarId}/booking-token', [BookingTokenController::class, 'store']);

    Route::get('appointments', [AppointmentController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store']);
    Route::patch('appointments/{id}', [AppointmentController::class, 'update']);
    Route::post('appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('appointments/{id}/transfer', [AppointmentTransferController::class, 'store']);

    Route::get('sams/events', [SamsEventController::class, 'index']);
});

Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('doctors', [DoctorManagementController::class, 'index']);
    Route::post('doctors', [DoctorManagementController::class, 'store']);
    Route::get('doctors/{doctorId}', [DoctorManagementController::class, 'show']);
    Route::patch('doctors/{doctorId}', [DoctorManagementController::class, 'update']);
    Route::post('doctors/{doctorId}/reset-password', [DoctorManagementController::class, 'resetPassword']);
    Route::delete('doctors/{doctorId}', [DoctorManagementController::class, 'destroy']);

    Route::get('appointments', [AppointmentManagementController::class, 'index']);
    Route::post('appointments', [AppointmentManagementController::class, 'store']);
    Route::patch('appointments/{id}', [AppointmentManagementController::class, 'update']);
    Route::post('appointments/{id}/cancel', [AppointmentManagementController::class, 'cancel']);
    Route::post('appointments/{id}/transfer', [AppointmentTransferController::class, 'store']);

    Route::get('sams/events', [SamsManagementController::class, 'index']);
    Route::post('sams/events', [SamsManagementController::class, 'store']);
    Route::patch('sams/events/{id}', [SamsManagementController::class, 'update']);
    Route::delete('sams/events/{id}', [SamsManagementController::class, 'destroy']);

    Route::get('specialties', [SpecialtyManagementController::class, 'index']);
    Route::post('specialties', [SpecialtyManagementController::class, 'store']);
    Route::patch('specialties/{id}', [SpecialtyManagementController::class, 'update']);
    Route::delete('specialties/{id}', [SpecialtyManagementController::class, 'destroy']);
});
