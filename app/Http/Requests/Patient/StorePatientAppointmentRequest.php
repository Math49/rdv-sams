<?php

namespace App\Http\Requests\Patient;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePatientAppointmentRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
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
