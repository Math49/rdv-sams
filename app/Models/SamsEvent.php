<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class SamsEvent extends Model
{
    use HasFactory;

    protected $connection = 'mongodb';
    protected $collection = 'sams_events';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'startAt',
        'endAt',
        'location',
        'description',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'startAt' => 'datetime',
            'endAt' => 'datetime',
        ];
    }
}
