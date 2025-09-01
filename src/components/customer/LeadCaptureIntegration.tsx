
import { useState, useEffect } from "react";
import { LeadCaptureDialog } from "@/components/leads/LeadCaptureDialog";
import { useLeadCapture } from "@/hooks/useLeadCapture";

interface LeadCaptureIntegrationProps {
  restaurantId: string;
}

export const LeadCaptureIntegration = ({ restaurantId }: LeadCaptureIntegrationProps) => {
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showBrowsingCapture, setShowBrowsingCapture] = useState(false);
  const [showCartAbandonmentCapture, setShowCartAbandonmentCapture] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);
  const [hasShownBrowsingCapture, setHasShownBrowsingCapture] = useState(false);
  const [hasShownCartAbandonment, setHasShownCartAbandonment] = useState(false);
  const { orderContext } = useLeadCapture();

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShownExitIntent) {
        setShowExitIntent(true);
        setHasShownExitIntent(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShownExitIntent]);

  // Browsing time capture (after 2 minutes)
  useEffect(() => {
    if (hasShownBrowsingCapture) return;

    const timer = setTimeout(() => {
      setShowBrowsingCapture(true);
      setHasShownBrowsingCapture(true);
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [hasShownBrowsingCapture]);

  // Cart abandonment detection (when items in cart but no action for 30 seconds)
  useEffect(() => {
    if (hasShownCartAbandonment || !orderContext.itemCount) return;

    const timer = setTimeout(() => {
      if (orderContext.itemCount > 0) {
        setShowCartAbandonmentCapture(true);
        setHasShownCartAbandonment(true);
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [orderContext.itemCount, hasShownCartAbandonment]);

  return (
    <>
      {/* Exit Intent Lead Capture */}
      <LeadCaptureDialog
        restaurantId={restaurantId}
        leadSource="exit_intent"
        defaultOpen={showExitIntent}
        onSubmitted={() => setShowExitIntent(false)}
        orderContext={orderContext}
      />

      {/* Browsing Time Lead Capture */}
      <LeadCaptureDialog
        restaurantId={restaurantId}
        leadSource="menu_browse"
        defaultOpen={showBrowsingCapture}
        onSubmitted={() => setShowBrowsingCapture(false)}
        orderContext={orderContext}
      />

      {/* Cart Abandonment Lead Capture */}
      <LeadCaptureDialog
        restaurantId={restaurantId}
        leadSource="pre_checkout"
        defaultOpen={showCartAbandonmentCapture}
        onSubmitted={() => setShowCartAbandonmentCapture(false)}
        orderContext={orderContext}
      />
    </>
  );
};
