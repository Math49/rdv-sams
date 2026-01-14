<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;

class AvailabilityRule extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'availability_rules';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'doctorId',
        'calendarId',
        'dayOfWeek',
        'startTime',
        'endTime',
        'slotMinutes',
        'validFrom',
        'validTo',
        'timezone',
    ];

    protected $attributes = [
        'timezone' => 'Europe/Paris',
    ];

    protected function casts(): array
    {
        return [
            'doctorId' => ObjectId::class,
            'calendarId' => ObjectId::class,
            'dayOfWeek' => 'integer',
            'slotMinutes' => 'integer',
            'validFrom' => 'date',
            'validTo' => 'date',
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
