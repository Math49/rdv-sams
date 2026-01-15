<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentType;
use App\Models\AvailabilityException;
use App\Models\AvailabilityRule;
use App\Models\Calendar;
use App\Models\Specialty;
use App\Models\User;
use Carbon\Carbon;
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
        $timezone = config('app.timezone', 'UTC');

        $specialties = [
            ['label' => 'Gynécologie', 'color' => '#EC4899'],
            ['label' => 'Médecine Légale', 'color' => '#0EA5E9'],
            ['label' => 'Psychologie', 'color' => '#A855F7'],
            ['label' => 'Kinésithérapie', 'color' => '#22C55E'],
        ];

        $specialtyIds = [];
        foreach ($specialties as $specialtyData) {
            $code = Str::slug($specialtyData['label']);
            $specialty = Specialty::query()->updateOrCreate(
                ['code' => $code],
                [
                    'label' => $specialtyData['label'],
                    'color' => $specialtyData['color'],
                    'isActive' => true,
                ]
            );
            $specialtyIds[$code] = (string) $specialty->getKey();
        }

        $admin = User::query()->updateOrCreate(
            ['identifier' => 'admin.math.daniel'],
            [
                'password' => 'root1234!',
                'name' => 'Math Daniel',
                'roles' => ['admin'],
                'specialtyIds' => [],
                'isActive' => true,
            ]
        );

        $doctorSpecialties = array_values(array_filter([
            $specialtyIds[Str::slug('Gynécologie')] ?? null,
            $specialtyIds[Str::slug('Médecine Légale')] ?? null,
        ]));

        $doctor = User::query()->updateOrCreate(
            ['identifier' => 'math.daniel'],
            [
                'password' => 'root1234!',
                'name' => 'Math Daniel',
                'roles' => ['doctor'],
                'specialtyIds' => $doctorSpecialties,
                'isActive' => true,
            ]
        );

        $doctorCalendar = Calendar::query()->updateOrCreate(
            [
                'scope' => 'doctor',
                'doctorId' => $doctor->getKey(),
                'label' => 'Consultations generales',
            ],
            [
                'specialtyId' => null,
                'color' => '#2563EB',
                'message' => 'Bonjour, utilisez le token {{TOKEN}} pour reserver votre rendez-vous.',
                'isActive' => true,
            ]
        );

        $gynCalendar = Calendar::query()->updateOrCreate(
            [
                'scope' => 'specialty',
                'doctorId' => $doctor->getKey(),
                'specialtyId' => $specialtyIds[Str::slug('Gynécologie')] ?? null,
            ],
            [
                'label' => 'Gynécologie',
                'color' => '#EC4899',
                'message' => 'Votre token pour la consultation de gynecologie: {{TOKEN}}.',
                'isActive' => true,
            ]
        );

        $legalCalendar = Calendar::query()->updateOrCreate(
            [
                'scope' => 'specialty',
                'doctorId' => $doctor->getKey(),
                'specialtyId' => $specialtyIds[Str::slug('Médecine Légale')] ?? null,
            ],
            [
                'label' => 'Médecine Légale',
                'color' => '#0EA5E9',
                'message' => 'Votre token pour la consultation medico-legale: {{TOKEN}}.',
                'isActive' => true,
            ]
        );

        Calendar::query()->updateOrCreate(
            [
                'scope' => 'sams',
                'label' => 'SAMS',
            ],
            [
                'doctorId' => null,
                'specialtyId' => null,
                'color' => '#22C55E',
                'message' => 'SAMS',
                'isActive' => true,
            ]
        );

        $doctorAppointmentType = AppointmentType::query()->updateOrCreate(
            [
                'doctorId' => $doctor->getKey(),
                'calendarId' => $doctorCalendar->getKey(),
                'code' => 'consultation',
            ],
            [
                'label' => 'Consultation',
                'specialtyId' => null,
                'durationMinutes' => 30,
                'bufferBeforeMinutes' => 0,
                'bufferAfterMinutes' => 0,
                'isActive' => true,
            ]
        );

        $gynAppointmentType = AppointmentType::query()->updateOrCreate(
            [
                'doctorId' => $doctor->getKey(),
                'calendarId' => $gynCalendar->getKey(),
                'code' => 'suivi-grossesse',
            ],
            [
                'label' => 'Suivi de grossesse',
                'specialtyId' => $gynCalendar->specialtyId,
                'durationMinutes' => 45,
                'bufferBeforeMinutes' => 0,
                'bufferAfterMinutes' => 0,
                'isActive' => true,
            ]
        );

        $legalAppointmentType = AppointmentType::query()->updateOrCreate(
            [
                'doctorId' => $doctor->getKey(),
                'calendarId' => $legalCalendar->getKey(),
                'code' => 'expertise-legale',
            ],
            [
                'label' => 'Expertise medico-legale',
                'specialtyId' => $legalCalendar->specialtyId,
                'durationMinutes' => 60,
                'bufferBeforeMinutes' => 0,
                'bufferAfterMinutes' => 0,
                'isActive' => true,
            ]
        );

        $workdays = [1, 2, 3, 4, 5];
        $this->seedAvailabilityRules($doctor, $doctorCalendar, $workdays, [
            ['start' => '09:00', 'end' => '12:00', 'slotMinutes' => 30],
            ['start' => '14:00', 'end' => '18:00', 'slotMinutes' => 30],
        ], $timezone);

        $this->seedAvailabilityRules($doctor, $gynCalendar, $workdays, [
            ['start' => '09:30', 'end' => '12:30', 'slotMinutes' => 30],
            ['start' => '14:00', 'end' => '17:30', 'slotMinutes' => 30],
        ], $timezone);

        $this->seedAvailabilityRules($doctor, $legalCalendar, $workdays, [
            ['start' => '13:00', 'end' => '17:00', 'slotMinutes' => 60],
        ], $timezone);

        $tomorrow = Carbon::now($timezone)->addDay()->startOfDay();
        AvailabilityException::query()->updateOrCreate(
            [
                'doctorId' => $doctor->getKey(),
                'calendarId' => $doctorCalendar->getKey(),
                'date' => $tomorrow->toDateString(),
                'kind' => 'remove',
                'startTime' => '10:00',
                'endTime' => '11:00',
            ],
            [
                'reason' => 'Formation',
            ]
        );

        $today = Carbon::now($timezone)->startOfDay();
        $appointments = [
            [
                'calendar' => $doctorCalendar,
                'appointmentType' => $doctorAppointmentType,
                'start' => $today->copy()->setTime(9, 0),
                'patient' => [
                    'lastname' => 'Durand',
                    'firstname' => 'Alice',
                    'phone' => '0601020304',
                    'company' => 'Clinique Nord',
                ],
                'reason' => 'Consultation generale',
            ],
            [
                'calendar' => $doctorCalendar,
                'appointmentType' => $doctorAppointmentType,
                'start' => $today->copy()->setTime(10, 0),
                'patient' => [
                    'lastname' => 'Petit',
                    'firstname' => 'Leo',
                    'phone' => '0605060708',
                    'company' => null,
                ],
                'reason' => 'Consultation generale',
            ],
            [
                'calendar' => $gynCalendar,
                'appointmentType' => $gynAppointmentType,
                'start' => $today->copy()->setTime(11, 0),
                'patient' => [
                    'lastname' => 'Martin',
                    'firstname' => 'Sarah',
                    'phone' => '0611223344',
                    'company' => null,
                ],
                'reason' => 'Suivi de grossesse',
            ],
            [
                'calendar' => $legalCalendar,
                'appointmentType' => $legalAppointmentType,
                'start' => $today->copy()->setTime(15, 0),
                'patient' => [
                    'lastname' => 'Leroy',
                    'firstname' => 'Paul',
                    'phone' => '0622334455',
                    'company' => 'Cabinet Expertises',
                ],
                'reason' => 'Expertise medico-legale',
            ],
            [
                'calendar' => $doctorCalendar,
                'appointmentType' => $doctorAppointmentType,
                'start' => $tomorrow->copy()->setTime(9, 30),
                'patient' => [
                    'lastname' => 'Morel',
                    'firstname' => 'Nina',
                    'phone' => '0633445566',
                    'company' => null,
                ],
                'reason' => 'Consultation generale',
            ],
            [
                'calendar' => $gynCalendar,
                'appointmentType' => $gynAppointmentType,
                'start' => $tomorrow->copy()->setTime(10, 30),
                'patient' => [
                    'lastname' => 'Bernard',
                    'firstname' => 'Emma',
                    'phone' => '0644556677',
                    'company' => null,
                ],
                'reason' => 'Suivi de grossesse',
            ],
            [
                'calendar' => $doctorCalendar,
                'appointmentType' => $doctorAppointmentType,
                'start' => $tomorrow->copy()->setTime(14, 0),
                'patient' => [
                    'lastname' => 'Roux',
                    'firstname' => 'Hugo',
                    'phone' => '0655667788',
                    'company' => null,
                ],
                'reason' => 'Consultation generale',
            ],
            [
                'calendar' => $legalCalendar,
                'appointmentType' => $legalAppointmentType,
                'start' => $tomorrow->copy()->setTime(16, 0),
                'patient' => [
                    'lastname' => 'Faure',
                    'firstname' => 'Ines',
                    'phone' => '0666778899',
                    'company' => 'Assurances Sud',
                ],
                'reason' => 'Expertise medico-legale',
            ],
        ];

        foreach ($appointments as $appointment) {
            $appointmentType = $appointment['appointmentType'];
            $duration = (int) $appointmentType->durationMinutes
                + (int) ($appointmentType->bufferBeforeMinutes ?? 0)
                + (int) ($appointmentType->bufferAfterMinutes ?? 0);

            $startAt = $appointment['start']->copy()->setTimezone($timezone)->utc();
            $endAt = $startAt->copy()->addMinutes($duration);

            Appointment::query()->updateOrCreate(
                [
                    'doctorId' => $doctor->getKey(),
                    'calendarId' => $appointment['calendar']->getKey(),
                    'appointmentTypeId' => $appointmentType->getKey(),
                    'startAt' => $startAt,
                ],
                [
                    'specialtyId' => $appointment['calendar']->specialtyId,
                    'endAt' => $endAt,
                    'status' => 'booked',
                    'createdBy' => 'seed',
                    'patient' => $appointment['patient'],
                    'reason' => $appointment['reason'],
                ]
            );
        }
    }

    private function seedAvailabilityRules(
        User $doctor,
        Calendar $calendar,
        array $days,
        array $windows,
        string $timezone
    ): void {
        foreach ($days as $day) {
            foreach ($windows as $window) {
                AvailabilityRule::query()->updateOrCreate(
                    [
                        'doctorId' => $doctor->getKey(),
                        'calendarId' => $calendar->getKey(),
                        'dayOfWeek' => $day,
                        'startTime' => $window['start'],
                        'endTime' => $window['end'],
                    ],
                    [
                        'slotMinutes' => $window['slotMinutes'],
                        'validFrom' => null,
                        'validTo' => null,
                        'timezone' => $timezone,
                    ]
                );
            }
        }
    }
}