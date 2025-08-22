
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Key, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VapidGenerator = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vapidKeys, setVapidKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<{ public: boolean; private: boolean }>({ public: false, private: false });

  const generateVapidKeys = async () => {
    try {
      setGenerating(true);
      
      // Generate VAPID key pair using Web Crypto API
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
      );

      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));

      setVapidKeys({
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      });

      toast({
        title: "VAPID keys generated",
        description: "Your VAPID key pair has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating VAPID keys:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate VAPID keys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'public' | 'private') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [type]: false }));
      }, 2000);
      
      toast({
        title: "Copied to clipboard",
        description: `${type} key copied successfully.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">VAPID Key Generator</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Generate Push Notification Keys</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                VAPID keys are required for push notifications. Generate a new key pair and store the private key securely in your Supabase secrets.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button 
                onClick={generateVapidKeys} 
                disabled={generating}
                size="lg"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate VAPID Keys
                  </>
                )}
              </Button>
            </div>

            {vapidKeys && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="publicKey">Public Key (Base64)</Label>
                  <div className="flex space-x-2">
                    <Textarea
                      id="publicKey"
                      value={vapidKeys.publicKey}
                      readOnly
                      className="font-mono text-sm"
                      rows={3}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(vapidKeys.publicKey, 'public')}
                    >
                      {copied.public ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add this to your frontend code as the VAPID public key.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privateKey">Private Key (Base64)</Label>
                  <div className="flex space-x-2">
                    <Textarea
                      id="privateKey"
                      value={vapidKeys.privateKey}
                      readOnly
                      className="font-mono text-sm"
                      rows={6}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(vapidKeys.privateKey, 'private')}
                    >
                      {copied.private ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Alert>
                    <AlertDescription>
                      <strong>Important:</strong> Store this private key securely in your Supabase secrets as "VAPID_PRIVATE_KEY". Never expose it in your frontend code.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VapidGenerator;
