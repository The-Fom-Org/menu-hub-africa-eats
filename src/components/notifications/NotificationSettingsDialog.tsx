
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RINGTONE_OPTIONS, RingtoneId } from "@/lib/audio/ringtones";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ringtone: RingtoneId;
  volume: number;
  enabled: boolean;
  onChange: (changes: Partial<{ ringtone: RingtoneId; volume: number; enabled: boolean }>) => void;
  onSave: () => void;
  onTest: () => void;
  isSaving?: boolean;
};

export function NotificationSettingsDialog({
  open,
  onOpenChange,
  ringtone,
  volume,
  enabled,
  onChange,
  onSave,
  onTest,
  isSaving,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kitchen Notification Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label>Enable audio notifications</Label>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm text-muted-foreground">Play sound when a new order arrives</span>
              <Switch
                checked={enabled}
                onCheckedChange={(v) => onChange({ enabled: v })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ringtone</Label>
            <Select
              value={ringtone}
              onValueChange={(v) => onChange({ ringtone: v as RingtoneId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose ringtone" />
              </SelectTrigger>
              <SelectContent>
                {RINGTONE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Volume</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[volume]}
                onValueChange={(v) => onChange({ volume: v[0] })}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <div className="w-12 text-right text-sm tabular-nums">{volume}%</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onTest}>
            Test sound
          </Button>
          <Button type="button" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
