<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;

class BookingToken extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'booking_tokens';

    protected $guarded = ['tokenHash'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'tokenHash',
        'doctorId',
        'calendarScope',
        'calendarId',
        'specialtyId',
        'expiresAt',
        'usedAt',
        'usedMeta',
        'createdByUserId',
    ];

    protected function casts(): array
    {
        return [
            'doctorId' => ObjectId::class,
            'calendarId' => ObjectId::class,
            'specialtyId' => ObjectId::class,
            'createdByUserId' => ObjectId::class,
            'expiresAt' => 'datetime',
            'usedAt' => 'datetime',
            'usedMeta' => 'array',
        ];
    }
}
