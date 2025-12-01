import { jwtDecode } from 'jwt-decode';
import * as z from 'zod';

// This is the single source of truth for the token's structure.
const AdminJwtPayloadSchema = z.object({
  sub: z.string(), // The user's ID
  email: z.string().email(),
  role: z.literal('ADMIN'),
  iat: z.number(),
  exp: z.number(),
});

export interface AdminUser {
  id: string;
  email: string;
  role: 'ADMIN';
}

/**
 * A type-safe function to decode and validate an Admin JWT.
 *
 * @param token The raw JWT string.
 * @returns A validated AdminUser object.
 * @throws An error if the token is invalid, malformed, or if the user is not an Admin.
 */
export const decodeAndValidateAdminJwt = (token: string): AdminUser => {
  try {
    const decoded = jwtDecode(token);
    
    const validatedPayload = AdminJwtPayloadSchema.parse(decoded);

    return {
      id: validatedPayload.sub,
      email: validatedPayload.email,
      role: validatedPayload.role,
    };
  } catch (error) {
    console.error("JWT validation failed:", error);
    throw new Error('Invalid authentication token or insufficient privileges.');
  }
};