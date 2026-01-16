<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('calendars');

        $collection->createIndex(
            ['doctorId' => 1, 'scope' => 1],
            [
                'name' => 'calendars_doctor_scope_unique',
                'unique' => true,
                'partialFilterExpression' => [
                    'scope' => 'doctor',
                    'doctorId' => ['$exists' => true],
                ],
            ]
        );

        $collection->createIndex(
            ['doctorId' => 1, 'specialtyId' => 1, 'scope' => 1],
            [
                'name' => 'calendars_specialty_scope_unique',
                'unique' => true,
                'partialFilterExpression' => [
                    'scope' => 'specialty',
                    'doctorId' => ['$exists' => true],
                    'specialtyId' => ['$exists' => true],
                ],
            ]
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('calendars');

        try {
            $collection->dropIndex('calendars_doctor_scope_unique');
        } catch (\Throwable $e) {
        }

        try {
            $collection->dropIndex('calendars_specialty_scope_unique');
        } catch (\Throwable $e) {
        }
    }
};
