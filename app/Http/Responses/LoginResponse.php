<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        return response()->json([
            'user' => $request->user(), //->load('roles'),
            'token' => $request->user()->createToken('auth')->plainTextToken
        ])->withCookie(cookie(
            'laravel_session',
            encrypt(session()->getId()),
            60 * 24 * 7,
            '/',
            null, // ou '' (chaîne vide) // '.site.com',
            true,
            true
        ));
    }
}