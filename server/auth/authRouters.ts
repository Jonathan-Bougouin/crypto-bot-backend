/**
 * Routes d'authentification pour tRPC
 */

import { z } from 'zod';
import { router, publicProcedure } from '../_core/trpc';
import { authService } from './authService';
import { TRPCError } from '@trpc/server';

// TODO: Importer le client de base de données
// import { db } from '../db';
// import { users } from '../../drizzle/schema_saas';

/**
 * Router d'authentification
 */
export const authRouter = router({
  /**
   * Inscription
   */
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Valider l'email
      if (!authService.validateEmail(input.email)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Email invalide',
        });
      }
      
      // Valider le mot de passe
      const passwordValidation = authService.validatePassword(input.password);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors.join(', '),
        });
      }
      
      // Hasher le mot de passe
      const passwordHash = await authService.hashPassword(input.password);
      
      // Générer un token de vérification d'email
      const emailVerificationToken = authService.generateEmailVerificationToken();
      
      // TODO: Créer l'utilisateur dans la base de données
      // const [user] = await db.insert(users).values({
      //   email: input.email,
      //   passwordHash,
      //   firstName: input.firstName,
      //   lastName: input.lastName,
      //   emailVerificationToken,
      //   subscriptionStatus: 'trialing',
      //   trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
      // }).returning();
      
      // Pour l'instant, simuler la création
      const user = {
        id: 'temp-user-id',
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: 'user' as const,
        subscriptionStatus: 'trialing',
        subscriptionPlan: undefined,
      };
      
      // Générer un token JWT
      const token = authService.generateToken(user);
      
      // TODO: Envoyer l'email de vérification
      // await sendVerificationEmail(user.email, emailVerificationToken);
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    }),
  
  /**
   * Connexion
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Récupérer l'utilisateur depuis la base de données
      // const [user] = await db.select().from(users).where(eq(users.email, input.email));
      
      // Pour l'instant, simuler
      const user = null;
      
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }
      
      // Vérifier le mot de passe
      // const isValid = await authService.verifyPassword(input.password, user.passwordHash);
      const isValid = false;
      
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Email ou mot de passe incorrect',
        });
      }
      
      // TODO: Mettre à jour la date de dernière connexion
      // await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
      
      // Générer un token JWT
      // const token = authService.generateToken(user);
      
      return {
        token: 'temp-token',
        user: {
          id: 'temp-id',
          email: input.email,
        },
      };
    }),
  
  /**
   * Vérifier l'email
   */
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Vérifier le token et mettre à jour l'utilisateur
      // const [user] = await db.select().from(users)
      //   .where(eq(users.emailVerificationToken, input.token));
      
      // if (!user) {
      //   throw new TRPCError({
      //     code: 'BAD_REQUEST',
      //     message: 'Token de vérification invalide',
      //   });
      // }
      
      // await db.update(users).set({
      //   isEmailVerified: true,
      //   emailVerificationToken: null,
      // }).where(eq(users.id, user.id));
      
      return {
        success: true,
        message: 'Email vérifié avec succès',
      };
    }),
  
  /**
   * Demander une réinitialisation de mot de passe
   */
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Vérifier que l'utilisateur existe
      // const [user] = await db.select().from(users).where(eq(users.email, input.email));
      
      // if (!user) {
      //   // Ne pas révéler si l'email existe ou non
      //   return {
      //     success: true,
      //     message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      //   };
      // }
      
      // Générer un token de réinitialisation
      const resetToken = authService.generateResetPasswordToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
      
      // TODO: Sauvegarder le token
      // await db.update(users).set({
      //   resetPasswordToken: resetToken,
      //   resetPasswordExpires: resetExpires,
      // }).where(eq(users.id, user.id));
      
      // TODO: Envoyer l'email de réinitialisation
      // await sendPasswordResetEmail(user.email, resetToken);
      
      return {
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      };
    }),
  
  /**
   * Réinitialiser le mot de passe
   */
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      // Valider le nouveau mot de passe
      const passwordValidation = authService.validatePassword(input.newPassword);
      if (!passwordValidation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordValidation.errors.join(', '),
        });
      }
      
      // TODO: Vérifier le token
      // const [user] = await db.select().from(users)
      //   .where(eq(users.resetPasswordToken, input.token));
      
      // if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      //   throw new TRPCError({
      //     code: 'BAD_REQUEST',
      //     message: 'Token de réinitialisation invalide ou expiré',
      //   });
      // }
      
      // Hasher le nouveau mot de passe
      const passwordHash = await authService.hashPassword(input.newPassword);
      
      // TODO: Mettre à jour le mot de passe
      // await db.update(users).set({
      //   passwordHash,
      //   resetPasswordToken: null,
      //   resetPasswordExpires: null,
      // }).where(eq(users.id, user.id));
      
      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };
    }),
});

export default authRouter;
