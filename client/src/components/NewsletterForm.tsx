import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const subscribeMutation = trpc.marketing.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setIsSuccess(true);
      setEmail("");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeMutation.mutate({ email, source: "landing_hero" });
  };

  if (isSuccess) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-3">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-green-500 mb-2">Inscription Réussie !</h3>
        <p className="text-sm text-muted-foreground">
          Votre guide "Les 5 Stratégies Crypto 2025" est en route vers votre boîte mail.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="email" 
            placeholder="votre@email.com" 
            className="pl-10 h-12 bg-background/80 backdrop-blur-sm border-primary/20 focus:border-primary transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button 
          type="submit" 
          size="lg" 
          className="h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          disabled={subscribeMutation.isPending}
        >
          {subscribeMutation.isPending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              Recevoir le Guide <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-3 text-center">
        🔒 100% Gratuit. Désabonnement en 1 clic. Déjà <span className="font-bold text-primary">1,240+</span> traders inscrits.
      </p>
    </div>
  );
}
