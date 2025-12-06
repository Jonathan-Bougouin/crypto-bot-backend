import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { db } from '../../drizzle/db';
import { leads } from '../../drizzle/schema_saas';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { emailService } from '../services/emailService';

export const marketingRouter = router({
  // Inscription à la newsletter / Lead Magnet
  subscribe: publicProcedure
    .input(z.object({
      email: z.string().email("Email invalide"),
      source: z.string().default("landing_page")
    }))
    .mutation(async ({ input }) => {
      // Vérifier si l'email existe déjà
      const existingLead = await db.query.leads.findFirst({
        where: eq(leads.email, input.email),
      });

      if (existingLead) {
        // Si déjà inscrit, on met à jour la source si besoin ou on renvoie succès
        return { success: true, message: "Vous êtes déjà inscrit !" };
      }

      // Créer le nouveau lead
      await db.insert(leads).values({
        id: uuidv4(),
        email: input.email,
        source: input.source,
        status: 'subscribed',
        leadMagnetDownloaded: false, // Sera mis à true quand ils cliqueront sur le lien dans l'email
      });

      // Déclencher l'envoi de l'email de bienvenue avec le PDF
      await emailService.sendWelcomeEmail(input.email);

      return { success: true, message: "Inscription réussie ! Vérifiez votre boîte mail." };
    }),
});
