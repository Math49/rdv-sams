<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Patient/TokenLogin'));

Route::prefix('patient')->middleware('patient.web')->group(function () {
    Route::get('doctors/{doctorId}', fn (string $doctorId) => Inertia::render('Patient/DoctorShow', [
        'doctorId' => $doctorId,
    ]));
    Route::get('book/{calendarId}', fn (string $calendarId) => Inertia::render('Patient/Booking', [
        'calendarId' => $calendarId,
    ]));
});

Route::prefix('dashboard')->group(function () {
    Route::get('login', fn () => Inertia::render('Dashboard/Login'));

    Route::middleware('dashboard.auth')->group(function () {
        Route::get('/', fn () => Inertia::render('Dashboard/Calendar/Index'));
        Route::get('calendars', fn () => Inertia::render('Dashboard/Calendars/Index'));
        Route::get('calendars/{calendarId}', fn (string $calendarId) => Inertia::render('Dashboard/Calendars/Show', [
            'calendarId' => $calendarId,
        ]));
        Route::get('calendars/{calendarId}/rules', fn (string $calendarId) => Inertia::render('Dashboard/Availability/Rules', [
            'calendarId' => $calendarId,
        ]));
        Route::get('calendars/{calendarId}/exceptions', fn (string $calendarId) => Inertia::render('Dashboard/Availability/Exceptions', [
            'calendarId' => $calendarId,
        ]));
        Route::get('calendars/{calendarId}/appointment-types', fn (string $calendarId) => Inertia::render('Dashboard/AppointmentTypes/Index', [
            'calendarId' => $calendarId,
        ]));

        Route::prefix('admin')->middleware('admin.web')->group(function () {
            Route::get('/', fn () => Inertia::render('Admin/Dashboard'));
            Route::get('doctors', fn () => Inertia::render('Admin/Doctors/Index'));
            Route::get('doctors/create', fn () => Inertia::render('Admin/Doctors/Create'));
            Route::get('doctors/{id}/edit', fn (string $id) => Inertia::render('Admin/Doctors/Edit', [
                'id' => $id,
            ]));
            Route::get('sams', fn () => Inertia::render('Admin/Sams/Index'));
            Route::get('sams/create', fn () => Inertia::render('Admin/Sams/Create'));
            Route::get('sams/{id}/edit', fn (string $id) => Inertia::render('Admin/Sams/Edit', [
                'id' => $id,
            ]));
            Route::get('appointments', fn () => Inertia::render('Admin/Appointments/Index'));
        });
    });
});
