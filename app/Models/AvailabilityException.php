<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;

class AvailabilityException extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'availability_exceptions';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'doctorId',
        'calendarId',
        'date',
        'kind',
        'startTime',
        'endTime',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'doctorId' => ObjectId::class,
            'calendarId' => ObjectId::class,
            'date' => 'date',
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
