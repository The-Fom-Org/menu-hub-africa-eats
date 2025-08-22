
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => Promise<boolean>;
  onDeny: () => void;
}

const NotificationPermissionDialog = ({
  open,
  onOpenChange,
  onAllow,
  onDeny,
}: NotificationPermissionDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleAllow = async () => {
    setLoading(true);
    const success = await onAllow();
    setLoading(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleDeny = () => {
    onDeny();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Stay Updated on Your Order</span>
          </DialogTitle>
          <DialogDescription className="text-left space-y-2">
            <p>
              Get instant notifications when your order status changes - from confirmed to ready for pickup!
            </p>
            <p>
              We'll notify you when:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
              <li>Your order is confirmed</li>
              <li>Preparation begins</li>
              <li>Your order is ready</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex space-x-2 mt-4">
          <Button
            onClick={handleAllow}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Enabling...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Allow Notifications
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={loading}
            className="flex-1"
          >
            <X className="mr-2 h-4 w-4" />
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationPermissionDialog;
