import { useRef, useState, useCallback } from "react";
import { Camera, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleImageUploaderProps {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  onUploadComplete: (imageURLs: string[]) => void;
  existingImages?: string[];
}

export function SimpleImageUploader({
  maxFiles = 5,
  maxFileSize = 10485760, // 10MB
  onUploadComplete,
  existingImages = [],
}: SimpleImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxFiles - existingImages.length;
    if (files.length > remainingSlots) {
      toast({
        title: "Too many files",
        description: `You can only upload ${remainingSlots} more file${remainingSlots > 1 ? 's' : ''}.`,
        variant: "destructive",
      });
      return;
    }

    // Validate file sizes and types
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit.`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadedURLs: string[] = [];

      for (const file of validFiles) {
        try {
          // Get upload URL
          const response = await fetch('/api/objects/upload', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            let errorMessage = 'Failed to get upload URL';
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
              // Include details if available
              if (errorData.details) {
                errorMessage += `: ${errorData.details}`;
              }
            } catch {
              // If response is not JSON, use status text
              errorMessage = response.status === 401 
                ? 'Please log in to upload photos'
                : response.status === 403
                ? 'You do not have permission to upload'
                : `Server error (${response.status})`;
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          const { uploadURL, objectPath, imageURL } = data;
          
          if (!uploadURL || !objectPath) {
            throw new Error('No upload URL received from server');
          }

          // Upload file to S3
          const uploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload file');
          }

          // Use the full imageURL if provided, otherwise fall back to objectPath
          // This ensures we store the complete URL for easy access
          const finalImageURL = imageURL || `/api${objectPath}`;
          uploadedURLs.push(finalImageURL);
        } catch (error) {
          console.error('Error uploading file:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
      }

      if (uploadedURLs.length > 0) {
        onUploadComplete(uploadedURLs);
        toast({
          title: "Upload successful",
          description: `${uploadedURLs.length} photo${uploadedURLs.length > 1 ? 's' : ''} uploaded successfully.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [maxFiles, existingImages.length, maxFileSize, onUploadComplete, toast]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const canUploadMore = existingImages.length < maxFiles;
    if (!canUploadMore || uploading) return;
    
    await processFiles(e.dataTransfer.files);
  };

  const canUploadMore = existingImages.length < maxFiles;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canUploadMore || uploading}
      />

      {canUploadMore && (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-3 py-8 px-6 border-2 border-dashed rounded-lg transition-all cursor-pointer group ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-slate-300 bg-slate-50/50 hover:border-primary hover:bg-primary/5'
          }`}
        >
          {uploading ? (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Uploading...
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary/10 transition-colors">
                <Camera className="h-6 w-6 text-slate-500 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-700">
                  Click to upload photos
                </p>
                <p className="text-xs text-slate-500">
                  or drag and drop files here
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  PNG, JPG up to {Math.round(maxFileSize / 1024 / 1024)}MB each
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

