<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('availability_exceptions');

        $collection->createIndex(
            ['doctorId' => 1, 'date' => 1],
            ['name' => 'availability_exceptions_doctor_date']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('availability_exceptions');

        $collection->dropIndex('availability_exceptions_doctor_date');
    }
};
