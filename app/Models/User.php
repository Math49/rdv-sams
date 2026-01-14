<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use MongoDB\BSON\ObjectId as BSONObjectId;
use MongoDB\Laravel\Auth\User as Authenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'identifier',
        'password',
        'name',
        'roles',
        'specialtyIds',
        'isActive',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'remember_token',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'specialtyIds' => 'array',
            'isActive' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function getAuthIdentifierName(): string
    {
        return 'identifier';
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'doctorId');
    }

    public function availabilityRules()
    {
        return $this->hasMany(AvailabilityRule::class, 'doctorId');
    }

    public function availabilityExceptions()
    {
        return $this->hasMany(AvailabilityException::class, 'doctorId');
    }
public function setRolesAttribute(?array $value): void
    {
        if ($value === null) {
            $this->attributes['roles'] = [];
            return;
        }

        $this->attributes['roles'] = array_values(array_filter(
            $value,
            fn ($role) => is_string($role) && $role !== ''
        ));
    }

    public function getRolesAttribute($value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (is_array($decoded)) {
                return $decoded;
            }

            return $value !== '' ? [$value] : [];
        }

        return [];
    }

    public function setSpecialtyIdsAttribute(?array $value): void
    {
        if ($value === null) {
            $this->attributes['specialtyIds'] = [];
            return;
        }

        $this->attributes['specialtyIds'] = array_values(array_filter(array_map(
            fn ($id) => $id instanceof BSONObjectId ? $id : ($id ? new BSONObjectId($id) : null),
            $value
        )));
    }

    public function getSpecialtyIdsAttribute($value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_map(
            fn ($id) => $id instanceof BSONObjectId ? (string) $id : $id,
            $value
        );
    }

    public function specialties()
    {
        $ids = $this->specialtyIds;

        if (count($ids) === 0) {
            return Specialty::query()->where('_id', null);
        }

        $objectIds = array_map(fn ($id) => new BSONObjectId($id), $ids);

        return Specialty::query()->whereIn('_id', $objectIds);
    }
}
