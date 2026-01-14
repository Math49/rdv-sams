<?php

namespace Database\Seeders;

use App\Models\Specialty;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $specialties = [
            'Gynécologie',
            'Médecin légale (légiste)',
            'Psychologue',
            'Kiné',
        ];

        $specialtyIds = [];
        foreach ($specialties as $label) {
            $code = Str::slug($label);
            $specialty = Specialty::query()->updateOrCreate(
                ['code' => $code],
                [
                    'label' => $label,
                    'color' => null,
                    'isActive' => true,
                ]
            );
            $specialtyIds[$code] = (string) $specialty->getKey();
        }

        $adminIdentifier = 'admin.math.daniel';
        $admin = User::query()->where('identifier', $adminIdentifier)->first();
        if (! $admin) {
            $admin = User::query()->create([
                'identifier' => $adminIdentifier,
                'password' => 'ChangeMe123!',
                'name' => 'Math Daniel',
                'roles' => ['admin'],
                'specialtyIds' => [],
                'isActive' => true,
            ]);
        } else {
            $admin->fill([
                'name' => 'Math Daniel',
                'roles' => ['admin'],
                'isActive' => true,
            ])->save();
        }

        $doctorIdentifier = 'math.daniel';
        $doctor = User::query()->where('identifier', $doctorIdentifier)->first();
        $doctorSpecialties = array_values(array_filter([
            $specialtyIds[Str::slug('Gynécologie')] ?? null,
            $specialtyIds[Str::slug('Médecin légale (légiste)')] ?? null,
        ]));

        if (! $doctor) {
            User::query()->create([
                'identifier' => $doctorIdentifier,
                'password' => 'ChangeMe123!',
                'name' => 'Math Daniel',
                'roles' => ['doctor'],
                'specialtyIds' => $doctorSpecialties,
                'isActive' => true,
            ]);
        } else {
            $doctor->fill([
                'name' => 'Math Daniel',
                'roles' => ['doctor'],
                'specialtyIds' => $doctorSpecialties,
                'isActive' => true,
            ])->save();
        }
    }
}
