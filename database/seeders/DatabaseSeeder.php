<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $identifier = env('ADMIN_IDENTIFIER', 'admin');
        $password = env('ADMIN_PASSWORD', 'password');

        User::query()->updateOrCreate(
            ['identifier' => $identifier],
            [
                'password' => $password,
                'name' => 'Administrateur',
                'roles' => ['admin'],
                'specialtyIds' => [],
                'isActive' => true,
            ]
        );
    }
}
