import nodemailer from 'nodemailer';

// Configuration du transporteur (SMTP)
// En production, utilisez des variables d'environnement pour ces valeurs
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const emailService = {
  /**
   * Envoyer l'email de bienvenue avec le Lead Magnet
   */
  async sendWelcomeEmail(to: string) {
    if (!process.env.SMTP_USER) {
      console.log(`[DEV MODE] Email de bienvenue simulé pour ${to}`);
      return;
    }

    const mailOptions = {
      from: '"CryptoBot Pro" <no-reply@cryptobot-pro.com>',
      to,
      subject: '🎁 Votre Guide Crypto 2025 est là (à ne pas partager)',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Bienvenue dans l'élite ! 🚀</h1>
          <p>Bonjour,</p>
          <p>Félicitations pour votre inscription. Vous venez de faire le premier pas vers un trading plus intelligent.</p>
          <p>Comme promis, voici votre accès exclusif au guide <strong>"Les 5 Stratégies Secrètes des Baleines Crypto"</strong> :</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://cryptobot-pro.manus.app/guides/whale-strategies-2025.pdf" style="background-color: #10b981; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Télécharger mon Guide PDF</a>
          </div>
          <p>Prenez 10 minutes pour le lire. Demain, je vous partagerai une astuce simple pour sécuriser vos gains automatiquement.</p>
          <p>À votre succès,<br>L'équipe CryptoBot Pro</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email de bienvenue envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
    }
  },

  /**
   * Envoyer une alerte de trading
   */
  async sendTradingAlert(to: string, asset: string, action: 'BUY' | 'SELL', price: number) {
    if (!process.env.SMTP_USER) {
      console.log(`[DEV MODE] Alerte trading simulée pour ${to}: ${action} ${asset}`);
      return;
    }

    const color = action === 'BUY' ? '#10b981' : '#ef4444';
    
    const mailOptions = {
      from: '"CryptoBot Alert" <alerts@cryptobot-pro.com>',
      to,
      subject: `🚨 ALERTE ${action} : ${asset}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border-left: 5px solid ${color}; padding-left: 20px;">
          <h2 style="color: ${color};">${action} ${asset} MAINTENANT</h2>
          <p><strong>Prix :</strong> $${price}</p>
          <p>Notre algorithme vient de détecter une opportunité majeure.</p>
          <p><a href="https://cryptobot-pro.manus.app/dashboard">Voir sur le Dashboard</a></p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'alerte:', error);
    }
  }
};
