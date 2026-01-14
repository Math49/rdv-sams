<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        Schema::create('booking_tokens', function (Blueprint $collection) {
            $collection->index(
                'tokenHash',
                options: ['unique' => true, 'name' => 'bt_token_hash_unique']
            );

            $collection->index(
                'expiresAt',
                options: ['expireAfterSeconds' => 0, 'name' => 'bt_expires_ttl']
            );

            $collection->index(
                ['doctorId' => 1, 'expiresAt' => 1],
                name: 'bt_doctor_expires_idx'
            );

            $collection->index(['calendarId' => 1], name: 'bt_calendar_idx');
            $collection->index(['specialtyId' => 1], name: 'bt_specialty_idx');

            $collection->index(['usedAt' => 1], name: 'bt_usedat_idx');
        });
    }

    public function down(): void
    {
        Schema::drop('booking_tokens');
    }
};
