<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('calendars');

        $collection->createIndex(
            ['scope' => 1, 'doctorId' => 1],
            ['name' => 'calendars_scope_doctorId']
        );

        $collection->createIndex(
            ['scope' => 1, 'specialtyId' => 1],
            ['name' => 'calendars_scope_specialtyId']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('calendars');

        $collection->dropIndex('calendars_scope_doctorId');
        $collection->dropIndex('calendars_scope_specialtyId');
    }
};
