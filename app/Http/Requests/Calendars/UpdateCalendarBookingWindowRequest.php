<?php

namespace App\Http\Requests\Calendars;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCalendarBookingWindowRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'bookingMinHours' => ['required', 'integer', 'min:0', 'max:720'],
            'bookingMaxDays' => ['required', 'integer', 'min:1', 'max:730'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'bookingMinHours.required' => 'Le délai minimum est requis.',
            'bookingMinHours.integer' => 'Le délai minimum doit être un nombre entier.',
            'bookingMinHours.min' => 'Le délai minimum ne peut pas être négatif.',
            'bookingMinHours.max' => 'Le délai minimum ne peut pas dépasser 720 heures (30 jours).',
            'bookingMaxDays.required' => 'Le délai maximum est requis.',
            'bookingMaxDays.integer' => 'Le délai maximum doit être un nombre entier.',
            'bookingMaxDays.min' => 'Le délai maximum doit être d\'au moins 1 jour.',
            'bookingMaxDays.max' => 'Le délai maximum ne peut pas dépasser 730 jours (2 ans).',
        ];
    }
}
