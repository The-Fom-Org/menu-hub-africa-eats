
import { useNavigate } from "react-router-dom";
import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRestaurantNotifications } from "@/hooks/useRestaurantNotifications";
import { NotificationSettingsDialog } from "./NotificationSettingsDialog";

export function NotificationBell() {
  const navigate = useNavigate();
  const {
    unreadCount,
    pulse,
    settings,
    isLoading,
    isSaving,
    open,
    setOpen,
    setSettings,
    saveSettings,
    testRingtone,
    markAllAsRead,
    options,
  } = useRestaurantNotifications();

  const handleClickBell = () => {
    navigate("/orders");
    markAllAsRead();
  };

  const enabled = settings?.notifications_enabled ?? true;
  const ringtone = settings?.ringtone ?? 'classic-bell';
  const volume = settings?.volume ?? 90;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClickBell}
          className={cn("relative", pulse && "animate-pulse")}
          aria-label="View orders"
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-medium text-destructive-foreground">
                  {unreadCount}
                </span>
                <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 animate-ping rounded-full bg-destructive/60" />
              </>
            )}
          </div>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Notification settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      {!isLoading && (
        <NotificationSettingsDialog
          open={open}
          onOpenChange={setOpen}
          ringtone={ringtone}
          volume={volume}
          enabled={enabled}
          onChange={(changes) => {
            const next = {
              ...settings!,
              ringtone: (changes.ringtone ?? ringtone) as typeof ringtone,
              volume: changes.volume ?? volume,
              notifications_enabled: changes.enabled ?? enabled,
            };
            setSettings(next as any);
          }}
          onSave={saveSettings}
          onTest={testRingtone}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
