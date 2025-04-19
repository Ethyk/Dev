// src/hooks.server.ts
import type { Handle, HandleFetch } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { parse } from 'set-cookie-parser';
import { dev } from '$app/environment';

import { PUBLIC_API_BASE_URL } from '$env/static/public';
import { getCookieValue, reconstructCookieString } from '$lib/server/utils';
import type { User } from '$lib/types';

/** Handle principal */
const handleInitialize: Handle = async ({ event, resolve }) => {
    const { request, url, locals } = event;
    locals.apiResponseCookies = [];
    locals.user = null;

    if (dev) console.log(`[Init - ${request.method} ${url.pathname}] Req Cookies: ${request.headers.get('cookie')?.substring(0, 50) || '<None>'}`);

    const response = await resolve(event);

    if (locals.apiResponseCookies.length > 0) {
        const uniqueCookies = [...new Set(locals.apiResponseCookies)];
        if (dev) console.log(`[Init - ${request.method} ${url.pathname}] Appending ${uniqueCookies.length} Set-Cookie(s)`);
        uniqueCookies.forEach(cookieString => {
            try { response.headers.append('Set-Cookie', cookieString); } catch (e: any) { /* Gérer erreur */ }
        });
        // Réinitialise pour éviter fuite mémoire si l'objet event est réutilisé (improbable mais propre)
        // locals.apiResponseCookies = [];
    }
    return response;
};

/** HandleFetch pour l'API */
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
    if (request.url.startsWith(PUBLIC_API_BASE_URL)) {
        const logPrefix = `[Fetch -> ${request.method} ${request.url.split('/').pop()}]`;
        const clonedRequest = new Request(request.url, request);
        const browserCookies = event.request.headers.get('cookie');

        if (browserCookies) clonedRequest.headers.set('cookie', browserCookies);
        const xsrfToken = getCookieValue(event.request, 'XSRF-TOKEN');
        if (xsrfToken) clonedRequest.headers.set('X-XSRF-TOKEN', xsrfToken);
        clonedRequest.headers.set('Accept', 'application/json');
        clonedRequest.headers.set('Referer', event.url.href);

        if (dev) console.log(`${logPrefix} Sending Req`);

        let apiResponse: Response;
        try {
            apiResponse = await fetch(clonedRequest);
            if (dev) console.log(`${logPrefix} API Status: ${apiResponse.status}`);
        } catch (error) {
            console.error(`${logPrefix} Fetch Error:`, error);
            return new Response(JSON.stringify({ message: 'API fetch error' }), { status: 503 });
        }

        try {
            const parsedCookieObjects = parse(apiResponse);
            if (parsedCookieObjects?.length > 0) {
                const cookieStrings = parsedCookieObjects.map(reconstructCookieString).filter((cs): cs is string => cs !== null);
                if (cookieStrings.length > 0) {
                    event.locals.apiResponseCookies = cookieStrings;
                    if (dev) console.log(`${logPrefix} Stored ${cookieStrings.length} Set-Cookie strings`);
                }
            }
        } catch (parseError) { console.error(`${logPrefix} Cookie Parse Error:`, parseError); }

        return apiResponse;
    }
    return fetch(request);
};

export const handle: Handle = sequence(handleInitialize);