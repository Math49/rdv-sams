<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('appointment_types');

        $collection->createIndex(
            ['doctorId' => 1, 'calendarId' => 1, 'code' => 1],
            ['unique' => true, 'name' => 'appointment_types_doctor_calendar_code_unique']
        );

        $collection->createIndex(
            ['doctorId' => 1, 'calendarId' => 1],
            ['name' => 'appointment_types_doctor_calendar']
        );

        $collection->createIndex(
            ['calendarId' => 1],
            ['name' => 'appointment_types_calendarId']
        );

        $collection->createIndex(
            ['doctorId' => 1],
            ['name' => 'appointment_types_doctorId']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('appointment_types');

        $collection->dropIndex('appointment_types_doctor_calendar_code_unique');
        $collection->dropIndex('appointment_types_doctor_calendar');
        $collection->dropIndex('appointment_types_calendarId');
        $collection->dropIndex('appointment_types_doctorId');
    }
};
