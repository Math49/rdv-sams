<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('specialties');

        $collection->createIndex(
            ['code' => 1],
            ['unique' => true, 'name' => 'specialties_code_unique']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('specialties');

        $collection->dropIndex('specialties_code_unique');
    }
};
