import { AlertTriangle } from "lucide-react";

export function RiskDisclaimer() {
  return (
    <div className="bg-secondary/30 border-t border-border py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="space-y-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">AVERTISSEMENT SUR LES RISQUES :</p>
            <p>
              Le trading de crypto-monnaies et d'actifs financiers comporte un niveau de risque élevé et peut ne pas convenir à tous les investisseurs. 
              L'effet de levier peut fonctionner aussi bien contre vous que pour vous. Avant de décider de trader, vous devez examiner attentivement vos objectifs d'investissement, 
              votre niveau d'expérience et votre appétit pour le risque.
            </p>
            <p>
              <span className="font-bold text-red-400">Il existe une possibilité que vous subissiez une perte d'une partie ou de la totalité de votre investissement initial.</span> 
              Par conséquent, vous ne devriez pas investir de l'argent que vous ne pouvez pas vous permettre de perdre. 
              Vous devez être conscient de tous les risques associés au trading de crypto-monnaies et demander conseil à un conseiller financier indépendant si vous avez des doutes.
            </p>
            <p>
              Les performances passées ne préjugent pas des résultats futurs. CryptoBot Pro est un outil d'aide à la décision et d'automatisation, 
              et ne garantit aucun profit. L'utilisateur reste seul responsable de ses décisions de trading et de la configuration de ses stratégies.
            </p>
            <div className="pt-4 border-t border-border/50 flex flex-wrap gap-4">
              <a href="/legal" className="hover:text-primary transition-colors">Mentions Légales</a>
              <a href="/privacy" className="hover:text-primary transition-colors">Politique de Confidentialité</a>
              <a href="/terms" className="hover:text-primary transition-colors">Conditions Générales d'Utilisation</a>
            </div>
            <p className="pt-2 opacity-50">
              © {new Date().getFullYear()} CryptoBot Pro. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
