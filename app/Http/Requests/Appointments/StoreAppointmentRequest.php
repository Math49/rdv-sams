<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'doctorId' => ['nullable', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'calendarId' => ['required', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'appointmentTypeId' => ['required', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'startAt' => ['required', 'date'],
            'patient' => ['required', 'array'],
            'patient.lastname' => ['required', 'string'],
            'patient.firstname' => ['required', 'string'],
            'patient.phone' => ['required', 'string'],
            'patient.company' => ['nullable', 'string'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
