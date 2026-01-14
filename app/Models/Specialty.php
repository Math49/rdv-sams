<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Specialty extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'specialties';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'label',
        'color',
        'isActive',
    ];

    protected function casts(): array
    {
        return [
            'isActive' => 'boolean',
        ];
    }
}
