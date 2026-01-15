<?php

namespace App\Http\Requests\Patient;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ValidatePatientTokenRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $token = $this->input('token');
        if (is_string($token)) {
            $this->merge(['token' => trim($token)]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'size:10'],
        ];
    }
}
