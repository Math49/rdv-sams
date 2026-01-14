<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;

class AppointmentType extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'appointment_types';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'doctorId',
        'calendarId',
        'code',
        'label',
        'specialtyId',
        'durationMinutes',
        'bufferBeforeMinutes',
        'bufferAfterMinutes',
        'isActive',
    ];

    protected function casts(): array
    {
        return [
            'doctorId' => ObjectId::class,
            'calendarId' => ObjectId::class,
            'specialtyId' => ObjectId::class,
            'durationMinutes' => 'integer',
            'bufferBeforeMinutes' => 'integer',
            'bufferAfterMinutes' => 'integer',
            'isActive' => 'boolean',
        ];
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctorId');
    }

    public function calendar()
    {
        return $this->belongsTo(Calendar::class, 'calendarId');
    }
}
