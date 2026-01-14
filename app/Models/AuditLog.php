<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'audit_logs';

    public const CREATED_AT = 'createdAt';
    public const UPDATED_AT = null;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'actorUserId',
        'action',
        'entityType',
        'entityId',
        'payload',
        'createdAt',
    ];

    protected function casts(): array
    {
        return [
            'actorUserId' => ObjectId::class,
            'entityId' => ObjectId::class,
            'payload' => 'array',
            'createdAt' => 'datetime',
        ];
    }
}
