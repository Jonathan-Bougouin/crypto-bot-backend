/**
 * Service Stripe pour la gestion des abonnements
 * 
 * Gère la création de clients, abonnements, et webhooks Stripe
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialiser Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

// IDs des prix Stripe (à configurer dans le dashboard Stripe)
export const STRIPE_PRICES = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_1Sb5G8CKekhsS5m1A4Mb96Wz',
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1Sb5GHCKekhsS5m18x8n9DCh',
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_1Sb5GSCKekhsS5m1fv4459nI',
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
};

export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

/**
 * Service Stripe
 */
export class StripeService {
  /**
   * Créer un client Stripe
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: params.metadata || {},
    });
    
    return customer;
  }
  
  /**
   * Créer une session de paiement Checkout
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.email,
      client_reference_id: params.userId,
      subscription_data: params.trialDays ? {
        trial_period_days: params.trialDays,
      } : undefined,
      metadata: {
        userId: params.userId,
      },
    });
    
    return session;
  }
  
  /**
   * Créer un portail client pour gérer l'abonnement
   */
  async createCustomerPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    
    return session;
  }
  
  /**
   * Récupérer un abonnement
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  }
  
  /**
   * Annuler un abonnement
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      // Annuler à la fin de la période
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }
  
  /**
   * Réactiver un abonnement annulé
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }
  
  /**
   * Mettre à jour un abonnement (changer de plan)
   */
  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
    const subscription = await this.getSubscription(subscriptionId);
    
    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    });
  }
  
  /**
   * Vérifier la signature d'un webhook Stripe
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  }
  
  /**
   * Gérer les événements webhook
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`📨 Webhook reçu: ${event.type}`);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`⚠️  Type d'événement non géré: ${event.type}`);
    }
  }
  
  /**
   * Gérer la fin du checkout
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('✅ Checkout complété:', session.id);
    
    const userId = session.metadata?.userId || session.client_reference_id;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;
    
    // TODO: Mettre à jour l'utilisateur dans la base de données
    // await db.update(users).set({
    //   stripeCustomerId: customerId,
    //   stripeSubscriptionId: subscriptionId,
    //   subscriptionStatus: 'active',
    // }).where(eq(users.id, userId));
    
    console.log(`User ${userId} abonné avec succès`);
  }
  
  /**
   * Gérer la création d'un abonnement
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    console.log('✅ Abonnement créé:', subscription.id);
    
    // TODO: Créer l'abonnement dans la base de données
    // const priceId = subscription.items.data[0].price.id;
    // const plan = this.getPlanFromPriceId(priceId);
    
    // await db.insert(subscriptions).values({
    //   userId: subscription.metadata.userId,
    //   stripeSubscriptionId: subscription.id,
    //   stripeCustomerId: subscription.customer as string,
    //   stripePriceId: priceId,
    //   plan,
    //   status: subscription.status,
    //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
    //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    //   amount: subscription.items.data[0].price.unit_amount! / 100,
    //   currency: subscription.currency,
    // });
  }
  
  /**
   * Gérer la mise à jour d'un abonnement
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('🔄 Abonnement mis à jour:', subscription.id);
    
    // TODO: Mettre à jour l'abonnement dans la base de données
    // await db.update(subscriptions).set({
    //   status: subscription.status,
    //   currentPeriodStart: new Date(subscription.current_period_start * 1000),
    //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    //   canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    // }).where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  }
  
  /**
   * Gérer la suppression d'un abonnement
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('❌ Abonnement supprimé:', subscription.id);
    
    // TODO: Mettre à jour le statut dans la base de données
    // await db.update(users).set({
    //   subscriptionStatus: 'canceled',
    // }).where(eq(users.stripeSubscriptionId, subscription.id));
  }
  
  /**
   * Gérer le paiement d'une facture
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    console.log('💰 Facture payée:', invoice.id);
    
    // TODO: Enregistrer le paiement dans la base de données
    // await db.insert(payments).values({
    //   userId: invoice.metadata?.userId,
    //   stripePaymentIntentId: invoice.payment_intent as string,
    //   stripeInvoiceId: invoice.id,
    //   amount: invoice.amount_paid / 100,
    //   currency: invoice.currency,
    //   status: 'succeeded',
    //   paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
    // });
  }
  
  /**
   * Gérer l'échec d'un paiement
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('⚠️  Échec de paiement:', invoice.id);
    
    // TODO: Mettre à jour le statut et notifier l'utilisateur
    // await db.update(users).set({
    //   subscriptionStatus: 'past_due',
    // }).where(eq(users.stripeCustomerId, invoice.customer as string));
    
    // TODO: Envoyer un email de notification
  }
  
  /**
   * Déterminer le plan depuis le price ID
   */
  private getPlanFromPriceId(priceId: string): 'starter' | 'pro' | 'enterprise' {
    if (priceId.includes('starter')) return 'starter';
    if (priceId.includes('pro')) return 'pro';
    if (priceId.includes('enterprise')) return 'enterprise';
    return 'starter'; // Par défaut
  }
}

/**
 * Instance singleton du service Stripe
 */
export const stripeService = new StripeService();

export default stripeService;
