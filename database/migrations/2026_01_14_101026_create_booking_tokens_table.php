<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('booking_tokens');

        $collection->createIndex(
            ['tokenHash' => 1],
            ['unique' => true, 'name' => 'booking_tokens_tokenHash_unique']
        );

        $collection->createIndex(
            ['expiresAt' => 1],
            ['expireAfterSeconds' => 0, 'name' => 'booking_tokens_expiresAt_ttl']
        );

        $collection->createIndex(
            ['doctorId' => 1, 'expiresAt' => 1],
            ['name' => 'booking_tokens_doctor_expiresAt']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('booking_tokens');

        $collection->dropIndex('booking_tokens_tokenHash_unique');
        $collection->dropIndex('booking_tokens_expiresAt_ttl');
        $collection->dropIndex('booking_tokens_doctor_expiresAt');
    }
};
