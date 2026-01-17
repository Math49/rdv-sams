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
        'bookingMinHours',
        'bookingMaxDays',
    ];

    protected function casts(): array
    {
        return [
            'doctorId' => ObjectId::class,
            'specialtyId' => ObjectId::class,
            'isActive' => 'boolean',
            'bookingMinHours' => 'integer',
            'bookingMaxDays' => 'integer',
        ];
    }

    /**
     * Get booking min hours with default value.
     */
    public function getBookingMinHours(): int
    {
        return $this->bookingMinHours ?? 0;
    }

    /**
     * Get booking max days with default value.
     */
    public function getBookingMaxDays(): int
    {
        return $this->bookingMaxDays ?? 365;
    }

    public function appointmentTypes()
    {
        return $this->hasMany(AppointmentType::class, 'calendarId');
    }
}
