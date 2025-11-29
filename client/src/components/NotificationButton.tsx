import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

export function NotificationButton() {
  const {
    isSupported,
    isEnabled,
    permission,
    toggleNotifications,
  } = useNotifications();

  const handleClick = async () => {
    if (!isSupported) {
      toast.error("Les notifications ne sont pas supportées par votre navigateur");
      return;
    }

    if (permission === 'denied') {
      toast.error("Les notifications ont été bloquées. Veuillez les activer dans les paramètres de votre navigateur.");
      return;
    }

    toggleNotifications();
    
    if (!isEnabled) {
      toast.success("Notifications activées ! Vous serez alerté des nouvelles opportunités de trading.");
    } else {
      toast.info("Notifications désactivées");
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      className="gap-2"
    >
      {isEnabled ? (
        <>
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications ON</span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          <span className="hidden sm:inline">Notifications OFF</span>
        </>
      )}
    </Button>
  );
}
