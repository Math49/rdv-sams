<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use MongoDB\BSON\ObjectId;

class SpecialtyManagementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'message' => 'Specialties loaded',
            'data' => Specialty::query()->orderBy('label')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:120'],
            'color' => ['nullable', 'string', 'max:20'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $specialty = Specialty::query()->create([
            'label' => $data['label'],
            'code' => $this->generateUniqueCode($data['label']),
            'color' => $data['color'] ?? null,
            'isActive' => $data['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Specialty created',
            'data' => $specialty,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $specialty = Specialty::query()->where('_id', new ObjectId($id))->first();
        if (! $specialty) {
            return response()->json(['message' => 'Specialty not found'], 404);
        }

        $data = $request->validate([
            'label' => ['sometimes', 'string', 'max:120'],
            'color' => ['nullable', 'string', 'max:20'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        if (array_key_exists('label', $data)) {
            $specialty->label = $data['label'];
            if ($data['label'] !== $specialty->getOriginal('label')) {
                $specialty->code = $this->generateUniqueCode($data['label'], $id);
            }
        }
        if (array_key_exists('color', $data)) {
            $specialty->color = $data['color'];
        }
        if (array_key_exists('isActive', $data)) {
            $specialty->isActive = $data['isActive'];
        }

        $specialty->save();

        return response()->json([
            'message' => 'Specialty updated',
            'data' => $specialty,
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $specialty = Specialty::query()->where('_id', new ObjectId($id))->first();
        if (! $specialty) {
            return response()->json(['message' => 'Specialty not found'], 404);
        }

        $specialty->delete();

        return response()->json([
            'message' => 'Specialty deleted',
            'data' => null,
        ]);
    }

    private function generateUniqueCode(string $label, ?string $ignoreId = null): string
    {
        $base = Str::slug($label);
        if ($base === '') {
            $base = 'specialty';
        }

        $code = $base;
        $suffix = 2;

        while ($this->codeExists($code, $ignoreId)) {
            $code = $base.'-'.$suffix;
            $suffix++;
        }

        return $code;
    }

    private function codeExists(string $code, ?string $ignoreId = null): bool
    {
        $query = Specialty::query()->where('code', $code);
        if ($ignoreId) {
            $query->where('_id', '!=', new ObjectId($ignoreId));
        }
        return $query->exists();
    }
}
