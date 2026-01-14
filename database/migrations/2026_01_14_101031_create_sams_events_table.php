<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('sams_events');

        $collection->createIndex(
            ['startAt' => 1],
            ['name' => 'sams_events_startAt']
        );

        $collection->createIndex(
            ['source' => 1, 'startAt' => 1],
            ['name' => 'sams_events_source_startAt']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('sams_events');

        $collection->dropIndex('sams_events_startAt');
        $collection->dropIndex('sams_events_source_startAt');
    }
};
