<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('appointments');

        $collection->createIndex(
            ['doctorId' => 1, 'startAt' => 1],
            ['name' => 'appointments_doctor_startAt']
        );

        $collection->createIndex(
            ['calendarId' => 1, 'startAt' => 1],
            ['name' => 'appointments_calendar_startAt']
        );

        $collection->createIndex(
            ['status' => 1, 'startAt' => 1],
            ['name' => 'appointments_status_startAt']
        );

        $collection->createIndex(
            ['patient.phone' => 1],
            ['name' => 'appointments_patient_phone']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('appointments');

        $collection->dropIndex('appointments_doctor_startAt');
        $collection->dropIndex('appointments_calendar_startAt');
        $collection->dropIndex('appointments_status_startAt');
        $collection->dropIndex('appointments_patient_phone');
    }
};
