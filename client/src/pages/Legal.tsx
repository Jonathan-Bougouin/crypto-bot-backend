import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Legal() {
  return (
    <div className="min-h-screen bg-background py-12">
      <SEO 
        title="Mentions Légales & Risques - CryptoBot Pro"
        description="Informations légales, conditions d'utilisation et avertissements sur les risques liés au trading de crypto-monnaies."
      />

      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Mentions Légales & Avertissements</h1>

        <div className="space-y-8">
          {/* Avertissement Risques */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center gap-2">
                ⚠️ AVERTISSEMENT SUR LES RISQUES DE TRADING
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                <strong>Perte de Capital :</strong> Le trading de crypto-monnaies implique un risque élevé de perte rapide en capital. 
                L'effet de levier peut amplifier les gains comme les pertes. Vous ne devez investir que des sommes que vous pouvez vous permettre de perdre.
              </p>
              <p>
                <strong>Volatilité :</strong> Les marchés des crypto-actifs sont extrêmement volatils et peuvent ne pas convenir à tous les investisseurs.
              </p>
              <p>
                <strong>Absence de Garantie :</strong> Les performances passées de nos algorithmes ne préjugent pas des résultats futurs. 
                CryptoBot Pro ne garantit aucun profit et ne saurait être tenu responsable des pertes subies.
              </p>
              <p>
                <strong>Conseil Financier :</strong> CryptoBot Pro fournit des outils logiciels d'automatisation et d'analyse technique. 
                Nous ne fournissons PAS de conseils en investissement personnalisés. Consultez un conseiller financier indépendant avant toute décision.
              </p>
            </CardContent>
          </Card>

          {/* Éditeur */}
          <Card>
            <CardHeader>
              <CardTitle>1. Éditeur du Site</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Le site CryptoBot Pro est édité par :</p>
              <p><strong>Nom / Raison Sociale :</strong> [VOTRE NOM OU SOCIÉTÉ]</p>
              <p><strong>Adresse :</strong> [VOTRE ADRESSE]</p>
              <p><strong>Email :</strong> contact@cryptobotpro.com</p>
              <p><strong>Directeur de la publication :</strong> [VOTRE NOM]</p>
            </CardContent>
          </Card>

          {/* Hébergement */}
          <Card>
            <CardHeader>
              <CardTitle>2. Hébergement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Le site est hébergé par :</p>
              <p><strong>Manus Inc. / Railway Corp.</strong></p>
              <p>Infrastructure Cloud sécurisée.</p>
            </CardContent>
          </Card>

          {/* Données Personnelles */}
          <Card>
            <CardHeader>
              <CardTitle>3. Protection des Données (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                Les données collectées (email, clés API chiffrées) sont strictement nécessaires au fonctionnement du service.
                Vos clés API Coinbase sont chiffrées (AES-256) et ne sont jamais partagées avec des tiers.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
