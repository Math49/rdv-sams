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
        'reason',
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
            'reason' => 'string',
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

    public function setPatientAttribute(?array $value): void
    {
        if ($value === null) {
            $this->attributes['patient'] = null;
            return;
        }

        $allowedKeys = ['lastname', 'firstname', 'phone', 'company'];
        $patient = [];

        foreach ($allowedKeys as $key) {
            if (! array_key_exists($key, $value)) {
                continue;
            }

            $fieldValue = $value[$key];
            if ($fieldValue === null) {
                $patient[$key] = null;
                continue;
            }

            if (is_scalar($fieldValue)) {
                $patient[$key] = (string) $fieldValue;
            }
        }

        $this->attributes['patient'] = $patient;
    }

    public function getPatientAttribute($value): ?array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : null;
        }

        return null;
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
