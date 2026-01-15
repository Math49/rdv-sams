<?php

namespace App\Http\Requests\AppointmentTypes;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentTypeRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'doctorId' => ['nullable', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'specialtyId' => ['nullable', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'label' => ['required', 'string'],
            'durationMinutes' => ['required', 'integer', 'min:1'],
            'bufferBeforeMinutes' => ['nullable', 'integer', 'min:0'],
            'bufferAfterMinutes' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['sometimes', 'boolean'],
        ];
    }
}
