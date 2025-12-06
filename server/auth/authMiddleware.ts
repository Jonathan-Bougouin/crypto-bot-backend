/**
 * Middleware d'authentification pour tRPC
 * 
 * Vérifie le token JWT et charge les informations utilisateur
 */

import { TRPCError } from '@trpc/server';
import { authService, JWTPayload } from './authService';

export interface AuthContext {
  userId?: string;
  email?: string;
  role?: 'user' | 'admin';
  isAuthenticated: boolean;
}

/**
 * Créer le contexte d'authentification à partir de la requête
 */
export async function createAuthContext(req: any): Promise<AuthContext> {
  const authHeader = req.headers.authorization;
  const token = authService.extractTokenFromHeader(authHeader);
  
  if (!token) {
    return {
      isAuthenticated: false,
    };
  }
  
  const payload = authService.verifyToken(token);
  
  if (!payload) {
    return {
      isAuthenticated: false,
    };
  }
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    isAuthenticated: true,
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est authentifié
 */
export function requireAuth(ctx: AuthContext) {
  if (!ctx.isAuthenticated || !ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Vous devez être connecté pour accéder à cette ressource',
    });
  }
  
  return ctx as Required<AuthContext>;
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export function requireAdmin(ctx: AuthContext) {
  const authCtx = requireAuth(ctx);
  
  if (authCtx.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Vous n\'avez pas les permissions nécessaires',
    });
  }
  
  return authCtx;
}

export default {
  createAuthContext,
  requireAuth,
  requireAdmin,
};
