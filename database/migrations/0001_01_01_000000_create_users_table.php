<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('users');

        $collection->createIndex(
            ['identifier' => 1],
            ['unique' => true, 'name' => 'users_identifier_unique']
        );

        $collection->createIndex(
            ['specialtyIds' => 1],
            ['name' => 'users_specialtyIds']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('users');

        $collection->dropIndex('users_identifier_unique');
        $collection->dropIndex('users_specialtyIds');
    }
};
