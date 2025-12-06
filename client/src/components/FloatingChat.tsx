import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
    { role: 'bot', content: "Bonjour ! Je suis l'assistant CryptoBot. Comment puis-je vous aider à automatiser vos gains ?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userMsg = input;
    setInput("");

    // Simulation de réponse simple
    setTimeout(() => {
      let response = "Je peux vous aider à configurer votre bot. Avez-vous déjà un compte Coinbase ?";
      if (userMsg.toLowerCase().includes("prix") || userMsg.toLowerCase().includes("tarif")) {
        response = "Nos tarifs commencent à 0€/mois pour le plan Discovery. Le plan Pro est à 49€/mois.";
      } else if (userMsg.toLowerCase().includes("risque")) {
        response = "Le trading comporte des risques. Nous recommandons de commencer avec le mode Paper Trading (simulation) inclus gratuitement.";
      }
      setMessages(prev => [...prev, { role: 'bot', content: response }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)} 
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 animate-bounce"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 h-96 flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10">
          <CardHeader className="bg-primary text-primary-foreground py-3 flex flex-row justify-between items-center rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              Support CryptoBot
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-3 border-t border-border bg-background rounded-b-lg flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question..." 
              className="flex-1 h-9 text-sm"
            />
            <Button size="icon" className="h-9 w-9" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
