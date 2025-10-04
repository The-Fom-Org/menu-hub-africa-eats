import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ImageUploadProps {
  bucket: string;
  path?: string;
  value?: string;
  onChange?: (url: string) => void;
  className?: string;
  placeholder?: string;
  accept?: string;
}

export const ImageUpload = ({
  bucket,
  path = "",
  value,
  onChange,
  className = "",
  placeholder = "Click to upload image",
  accept = "image/*"
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadImage = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${path}${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage with no-cache to prevent CDN caching issues
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: 'no-cache',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onChange?.(publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    uploadImage(file);
  };

  const removeImage = () => {
    setPreviewUrl("");
    onChange?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        <Card className="relative overflow-hidden">
          <div className="aspect-video bg-muted flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Uploaded image"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="absolute top-2 right-2 space-x-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card 
          className="border-2 border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="aspect-video flex flex-col items-center justify-center p-8 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                <p className="text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">{placeholder}</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};