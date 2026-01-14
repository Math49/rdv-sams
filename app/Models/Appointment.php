<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\BSON\ObjectId as BSONObjectId;
use MongoDB\Laravel\Eloquent\Casts\ObjectId;
use MongoDB\Laravel\Eloquent\Model;


class Appointment extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'appointments';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'calendarId',
        'doctorId',
        'specialtyId',
        'appointmentTypeId',
        'startAt',
        'endAt',
        'status',
        'createdBy',
        'patient',
        'transfer',
    ];

    protected function casts(): array
    {
        return [
            'calendarId' => ObjectId::class,
            'doctorId' => ObjectId::class,
            'specialtyId' => ObjectId::class,
            'appointmentTypeId' => ObjectId::class,
            'startAt' => 'datetime',
            'endAt' => 'datetime',
            'patient' => 'array',
            'transfer' => 'array',
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

    public function appointmentType()
    {
        return $this->belongsTo(AppointmentType::class, 'appointmentTypeId');
    }

    public function setTransferAttribute(?array $value): void
    {
        if ($value === null) {
            $this->attributes['transfer'] = null;
            return;
        }

        foreach (['fromDoctorId', 'toDoctorId'] as $key) {
            if (! empty($value[$key]) && ! $value[$key] instanceof BSONObjectId) {
                $value[$key] = new BSONObjectId($value[$key]);
            }
        }

        $this->attributes['transfer'] = $value;
    }

    public function getTransferAttribute($value): ?array
    {
        if (! is_array($value)) {
            return $value;
        }

        foreach (['fromDoctorId', 'toDoctorId'] as $key) {
            if (isset($value[$key]) && $value[$key] instanceof BSONObjectId) {
                $value[$key] = (string) $value[$key];
            }
        }

        return $value;
    }
}
