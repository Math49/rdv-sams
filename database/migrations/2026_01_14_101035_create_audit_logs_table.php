<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('audit_logs');

        $collection->createIndex(
            ['entityType' => 1, 'entityId' => 1],
            ['name' => 'audit_logs_entity']
        );

        $collection->createIndex(
            ['actorUserId' => 1, 'createdAt' => 1],
            ['name' => 'audit_logs_actor_createdAt']
        );
    }

    public function down(): void
    {
        $collection = DB::connection('mongodb')->getMongoDB()->selectCollection('audit_logs');

        $collection->dropIndex('audit_logs_entity');
        $collection->dropIndex('audit_logs_actor_createdAt');
    }
};
