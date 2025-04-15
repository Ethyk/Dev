import { z } from 'zod';

export const formSchema = z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    name: z.string().optional(),
    isRegister: z.boolean().default(false).optional()
}).refine(data => {
    if (data.isRegister) {
        return !!data.name && data.name.trim().length >= 2;
    }
    return true;
}, {
    message: "Name must be at least 2 characters",
    path: ["name"]
});

export type FormSchema = typeof formSchema;

// // src/lib/schema/schema.ts
// import { z } from 'zod';

// export const formSchema = z.object({
//     email: z.string().email(),
//     password: z.string().min(8),
//     remember: z.boolean().optional()
// });

// export type FormSchema = typeof formSchema;