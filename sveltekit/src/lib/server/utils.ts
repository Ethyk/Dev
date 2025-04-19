// src/lib/server/utils.ts
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Récupère la valeur d'un cookie spécifique depuis l'en-tête Cookie d'une requête.
 * Décode la valeur car elle est souvent URL-encodée dans l'en-tête entrant.
 */
export function getCookieValue(request: Request, cookieName: string): string | undefined {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return undefined;
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const parts = cookie.trim().split('=');
        const name = parts.shift();
        const value = parts.join('=');
        if (name === cookieName) {
            try {
                return decodeURIComponent(value);
            } catch (e) {
                console.warn(`[Utils] Failed to decode cookie "${cookieName}"`, e);
                return value;
            }
        }
    }
    return undefined;
}

/**
 * Reconstruit une chaîne d'en-tête Set-Cookie à partir d'un objet parsé.
 * Nécessaire car set-cookie-parser peut retourner des objets.
 */
export function reconstructCookieString(cookieObject: any): string | null {
    if (cookieObject && typeof cookieObject === 'object' && cookieObject.name && cookieObject.value) {
        let cookieString = `${cookieObject.name}=${cookieObject.value}`; // Ne pas décoder ici
        if (cookieObject.expires) cookieString += `; Expires=${cookieObject.expires.toUTCString()}`;
        // Max-Age prend précédence sur Expires si les deux sont présents
        if (cookieObject.maxAge && typeof cookieObject.maxAge === 'number') cookieString += `; Max-Age=${cookieObject.maxAge}`;
        if (cookieObject.domain) cookieString += `; Domain=${cookieObject.domain}`;
        if (cookieObject.path) cookieString += `; Path=${cookieObject.path}`;
        if (cookieObject.secure) cookieString += `; Secure`;
        if (cookieObject.httpOnly) cookieString += `; HttpOnly`;
        if (cookieObject.sameSite) cookieString += `; SameSite=${cookieObject.sameSite}`; // 'Strict', 'Lax', 'None'
        return cookieString;
    }
    console.warn('[Utils] Invalid cookie object received for reconstruction:', cookieObject);
    return null;
}