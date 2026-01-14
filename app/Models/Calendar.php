<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;

class Calendar extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'calendars';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'scope',
        'doctorId',
        'specialtyId',
        'label',
        'color',
        'message',
        'isActive',
    ];

    protected function casts(): array
    {
        return [
            'doctorId' => ObjectId::class,
            'specialtyId' => ObjectId::class,
            'isActive' => 'boolean',
        ];
    }

    public function appointmentTypes()
    {
        return $this->hasMany(AppointmentType::class, 'calendarId');
    }
}
