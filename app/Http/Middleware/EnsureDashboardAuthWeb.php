<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EnsureDashboardAuthWeb
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): RedirectResponse|\Symfony\Component\HttpFoundation\Response
    {
        if (! $request->user()) {
            return redirect('/dashboard/login');
        }

        return $next($request);
    }
}
