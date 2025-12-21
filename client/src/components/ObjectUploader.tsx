import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'],
      },
      autoProceed: true,
      allowMultipleUploadBatches: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
        // Clear files after upload
        setTimeout(() => {
          uppy.cancelAll();
        }, 100);
      })
      .on("upload-error", (file, error) => {
        console.error("Upload error:", error);
      })
  );

  // Hide Uppy drag-drop container when modal is closed and prevent focus
  useEffect(() => {
    const hideUppyElements = () => {
      // Find all Uppy drag-drop containers outside the modal
      const uppyContainers = document.querySelectorAll('.uppy-DragDrop-container:not(.uppy-Dashboard--modal .uppy-DragDrop-container)');
      uppyContainers.forEach((container) => {
        const element = container as HTMLElement;
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.pointerEvents = 'none';
        element.setAttribute('aria-hidden', 'true');
        element.setAttribute('tabindex', '-1');
        
        // Also hide any buttons/links inside
        const buttons = element.querySelectorAll('button, a');
        buttons.forEach((btn) => {
          (btn as HTMLElement).setAttribute('tabindex', '-1');
          (btn as HTMLElement).style.pointerEvents = 'none';
        });
      });
    };

    // Run immediately and on interval to catch dynamically added elements
    hideUppyElements();
    const interval = setInterval(hideUppyElements, 100);

    return () => {
      clearInterval(interval);
      try {
        uppy.close();
        uppy.cancelAll();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [uppy, showModal]);

  return (
    <div className="relative">
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        className={buttonClassName || "cursor-pointer"}
        role="button"
        aria-label="Upload photos"
        tabIndex={-1}
        onMouseDown={(e) => {
          // Prevent focus on mousedown, but allow click
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          // Only allow opening with Enter or Space when explicitly focused
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowModal(true);
          }
        }}
        data-testid="button-upload-image"
      >
        {children}
      </div>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => {
          setShowModal(false);
          setTimeout(() => {
            uppy.cancelAll();
          }, 100);
        }}
        proudlyDisplayPoweredByUppy={false}
        closeModalOnClickOutside={true}
        theme="light"
        width={750}
        height={550}
        showProgressDetails={true}
        hideUploadButton={false}
        hideRetryButton={false}
        hideCancelButton={false}
        hidePauseResumeButton={false}
        note="Images only, up to 10MB each"
        disablePageScrollWhenModalOpen={true}
      />
    </div>
  );
}
