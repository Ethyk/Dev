<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        return response()->json([
            'message' => 'Compte créé avec succès',
            'user' => $request->user(),
            'token' => $request->user()->createToken('api-token')->plainTextToken,
        ], 201)->withCookie(
            // Si tu utilises des cookies
            cookie('laravel_session', encrypt($request->session()->getId()), 60*24*7, '/', null, true, true)
            // cookie('laravel_session', encrypt($request->session()->getId()), 60*24*7, '/', '.site.com', true, true)
        );
    }
}