// import type { RequestEvent } from "@sveltejs/kit";
// import cookie, { parse } from 'cookie';


// interface ApiParams {
// 	method: string;
// 	event?: RequestEvent;
// 	resource?: string;
// 	data?: Record<string, unknown> | null;
// }

// export async function api(params: ApiParams) {
// 	const base = import.meta.env.VITE_BASE_API
// 	let fullurl = base

// 	if (params.resource) {
// 		fullurl = `${base}/${params.resource}`
// 	}

// 	// Extraire le cookie XSRF-TOKEN
//     const cookies = params?.event?.request?.headers?.get('cookie') || '';
//     const parsed = cookie.parse(cookies);
//     const xsrfToken = parsed['XSRF-TOKEN'];

// 	const headers : Record<string, string> = {
//         'content-type': 'application/json',
//         'accept': 'application/json',
//         // On transmet tout le cookie pour la session
//         'cookie': cookies,
//     };
// 	// Si on fait une requête qui a besoin du CSRF, on ajoute le header
//     if (xsrfToken && ['post', 'put', 'patch', 'delete'].includes(params.method.toLowerCase())) {
//         headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
//     }

// 	const fetcher = params.event ? params.event.fetch : fetch;


// 	const response = await fetch(fullurl, {
// 		method: params.method,
// 		headers,
// 		// headers: {
// 		// 	'content-type': 'application/json',
// 		// 	'accept': 'application/json',
// 		// 	'cookie': params?.event?.request?.headers?.get('cookie') as string,
// 		// },
// 		body: params.data && JSON.stringify(params.data),
// 	})
// 	return response;
// }


import type { RequestEvent } from "@sveltejs/kit";
import cookie from 'cookie';

interface ApiParams {
	method: string;
	event?: RequestEvent;
	resource?: string;
	data?: Record<string, unknown> | null;
}

export async function api(params: ApiParams) {
	const base = import.meta.env.VITE_BASE_API;
	let fullurl = base;

	if (params.resource) {
		fullurl = `${base}/${params.resource}`;
	}

	const cookies = params?.event?.request?.headers?.get('cookie') || '';
	const parsed = cookie.parse(cookies);
	const xsrfToken = parsed['XSRF-TOKEN'];

	const headers: Record<string, string> = {
		'accept': 'application/json',
		'cookie': cookies
	};

	// Ajoute le content-type uniquement si ce n'est pas un GET
	if (params.method.toLowerCase() !== 'get') {
		headers['content-type'] = 'application/json';
	}

	// Ajoute le header CSRF pour les méthodes sensibles
	if (
		xsrfToken &&
		['post', 'put', 'patch', 'delete'].includes(params.method.toLowerCase())
	) {
		headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
	}
	console.log("xsrf: ",xsrfToken," ")
	console.log("methodes: ",params.method.toLowerCase())
	console.log("X",headers);
	const fetcher = params.event ? params.event.fetch : fetch;
	// console.log("hedaer a exec", headers);
	const fetchOptions: RequestInit = {
		method: params.method,
		headers
	};

	// Ajoute le body seulement si ce n'est pas un GET
	if (params.method.toLowerCase() !== 'get' && params.data) {
		fetchOptions.body = JSON.stringify(params.data);
	}

	const response = await fetcher(fullurl, fetchOptions);
	return response;
}
