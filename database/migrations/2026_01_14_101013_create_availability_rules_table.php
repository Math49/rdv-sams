<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('availability_rules');

        $collection->createIndex(
            ['doctorId' => 1, 'dayOfWeek' => 1],
            ['name' => 'availability_rules_doctor_dayOfWeek']
        );

        $collection->createIndex(
            ['doctorId' => 1, 'calendarId' => 1],
            ['name' => 'availability_rules_doctor_calendar']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('availability_rules');

        $collection->dropIndex('availability_rules_doctor_dayOfWeek');
        $collection->dropIndex('availability_rules_doctor_calendar');
    }
};
