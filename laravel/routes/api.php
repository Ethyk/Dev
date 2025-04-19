<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

// Dans routes/api.php (Laravel)
use Illuminate\Support\Facades\Log; // Ajoute cette ligne en haut

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {

    // // --- AJOUT POUR DEBUG ---
 
    // Log::info('[/api/user] Request received');
    // Log::info('[/api/user] Headers', $request->headers->all());
    // Log::info('[/api/user] Session ID', ['session_id' => session()->isStarted() ? session()->getId() : 'Session not started']);
    // Log::info('[/api/user] Authenticated User ID (via Auth facade)', ['user_id' => Auth::id() ?? 'null']);
    // Log::info('[/api/user] Authenticated User ID (via request->user())', ['user_id' => $request->user()?->id ?? 'null']);
    // // --- FIN AJOUT DEBUG ---

    if ($request->user()) {
        Log::info('[/api/user] Authentication successful. Returning user.');
        return $request->user();
    } else {
        // Si on arrive ici, l'authentification a échoué malgré le middleware
        Log::warning('[/api/user] Authentication failed within route handler.');
        return response()->json(['message' => 'Unauthenticated from route handler'], 401); // Retour explicite 401
    }
});

Route::get('/logged-in', [AuthController::class, 'loggedIn'])->middleware('auth:sanctum');

