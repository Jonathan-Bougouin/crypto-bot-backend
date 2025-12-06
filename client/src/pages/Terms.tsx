import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-12">
      <SEO 
        title="Conditions Générales de Vente - CryptoBot Pro"
        description="Conditions régissant l'utilisation et la vente des services d'automatisation de trading CryptoBot Pro."
      />

      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Conditions Générales de Vente et d'Utilisation (CGV/CGU)</h1>
        <p className="text-muted-foreground mb-8">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Objet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Les présentes Conditions Générales de Vente (ci-après "CGV") régissent l'ensemble des relations entre la société éditrice de CryptoBot Pro (ci-après "le Prestataire") et toute personne physique ou morale souhaitant souscrire aux services proposés (ci-après "le Client").
              </p>
              <p>
                Le service proposé est un logiciel en tant que service (SaaS) permettant l'automatisation d'ordres de trading sur des plateformes d'échange de crypto-actifs tierces (ex: Coinbase) via des clés API fournies par le Client.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Avertissement sur les Risques (Disclaimer)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4 border-l-4 border-red-500 pl-4">
              <p className="font-semibold text-foreground">
                Le Client reconnaît expressément que le trading de crypto-actifs comporte un risque élevé de perte en capital.
              </p>
              <p>
                Le Prestataire fournit un outil technique d'automatisation et ne délivre AUCUN conseil en investissement, ni recommandation personnalisée. Les stratégies configurées par le Client ou sélectionnées parmi des modèles prédéfinis le sont sous la seule et entière responsabilité du Client.
              </p>
              <p>
                Le Prestataire ne saurait être tenu responsable des pertes financières subies par le Client, qu'elles soient dues à des mouvements de marché, des erreurs de configuration, ou des dysfonctionnements des plateformes d'échange tierces.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Accès au Service et Clés API</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Pour utiliser le service, le Client doit connecter son compte d'échange (ex: Coinbase) en fournissant ses clés API.
              </p>
              <p>
                Le Client s'engage à :
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Ne fournir que des clés API avec les permissions "Trade" et "View".</li>
                  <li>NE JAMAIS fournir de clés API avec la permission "Withdraw" (Retrait).</li>
                  <li>Garder ses identifiants d'accès au service strictement confidentiels.</li>
                </ul>
              </p>
              <p>
                Le Prestataire s'engage à chiffrer les clés API du Client selon les standards de l'industrie (AES-256) et à ne jamais les divulguer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Abonnements et Paiements</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Les services sont proposés sous forme d'abonnement mensuel ou annuel, tacitement reconductible.
              </p>
              <p>
                <strong>Prix :</strong> Les tarifs en vigueur sont ceux affichés sur le site au moment de la souscription. Ils sont exprimés en Euros (€) ou Dollars ($).
              </p>
              <p>
                <strong>Paiement :</strong> Le paiement est exigible immédiatement à la commande. Il s'effectue par carte bancaire ou crypto-monnaie via un prestataire de paiement sécurisé (ex: Stripe).
              </p>
              <p>
                <strong>Rétractation :</strong> S'agissant de contenu numérique fourni sur un support immatériel dont l'exécution a commencé avec l'accord du Client, le droit de rétractation ne peut être exercé, conformément à l'article L.221-28 du Code de la consommation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Disponibilité et Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Le Prestataire s'efforce de maintenir le service accessible 24h/24 et 7j/7, mais n'est tenu qu'à une obligation de moyens. L'accès peut être interrompu pour des raisons de maintenance technique ou de force majeure.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Résiliation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Le Client peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prendra effet à la fin de la période d'abonnement en cours. Aucun remboursement prorata temporis n'est effectué.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Droit Applicable</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-4">
              <p>
                Les présentes CGV sont soumises au droit français (ou du pays de résidence de l'éditeur). Tout litige relatif à leur interprétation et/ou à leur exécution relève des tribunaux compétents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
