// // src/lib/types.ts
// export interface User {
//     id: number;
//     name: string;
//     email: string;
//     // email_verified_at: string | null; // Exemple
//     // created_at: string; // Exemple
//     // updated_at: string; // Exemple
//     // ajoute les champs que ton API /api/user renvoie réellement
// }
 
//   export interface Session {
//     name: string; // laravel_session
//     value: string;
//     expires?: Date;
//     path?: string;
//     httpOnly?: boolean;
//     sameSite?: 'lax' | 'strict' | 'none';
//     secure?: boolean;
//     domain?: string;
//   }
  
//   export interface XsrfToken {
//     name: string; // XSRF-TOKEN
//     value: string;
//     expires?: Date;
//     path?: string;
//     httpOnly?: boolean;
//     sameSite?: 'lax' | 'strict' | 'none';
//     secure?: boolean;
//     domain?: string;
//   }
export interface Session {
  name: string;
  value: string;
  expires?: Date;
  path?: string;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  domain?: string | null;
}

export interface XsrfToken {
  name: string;
  value: string;
  expires?: Date;
  path?: string;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  domain?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: any;
}