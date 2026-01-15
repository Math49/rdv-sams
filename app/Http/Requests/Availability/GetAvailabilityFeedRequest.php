<?php

namespace App\Http\Requests\Availability;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GetAvailabilityFeedRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['doctorIds', 'calendarIds'] as $key) {
            $value = $this->input($key);
            if (is_string($value)) {
                $items = array_values(array_filter(array_map('trim', explode(',', $value))));
                $this->merge([$key => $items]);
            }
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'doctorId' => ['nullable', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'doctorIds' => ['sometimes', 'array'],
            'doctorIds.*' => ['string', 'regex:/^[a-f0-9]{24}$/i'],
            'calendarIds' => ['sometimes', 'array'],
            'calendarIds.*' => ['string', 'regex:/^[a-f0-9]{24}$/i'],
        ];
    }
}
