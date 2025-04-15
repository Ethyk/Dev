<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Controllers\{
    AuthenticatedSessionController,
    RegisteredUserController
};

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Auth
// Route::post('/login', [AuthController::class, 'login']);
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');


// Activation des routes Fortify
if (Features::enabled(Features::registration())) {
    Route::post('/register', [RegisteredUserController::class, 'store']);
}

Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
     ->middleware('auth:sanctum');



// Exemple de route protégée
Route::middleware(['auth:sanctum', 'role:tattoo_artist'])->get('/dashboard', function () {
    return response()->json(['message' => 'Accès artiste autorisé']);
});

// Authentification Fortify
Route::post('/sanctum/csrf-cookie', function () {
    return response()->noContent(); // Nécessaire pour les cookies cross-domain
});


