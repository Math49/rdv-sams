<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'appointmentTypeId' => ['sometimes', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'startAt' => ['sometimes', 'date'],
            'patient' => ['sometimes', 'array'],
            'patient.lastname' => ['sometimes', 'string'],
            'patient.firstname' => ['sometimes', 'string'],
            'patient.phone' => ['sometimes', 'string'],
            'patient.company' => ['sometimes', 'nullable', 'string'],
            'reason' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
