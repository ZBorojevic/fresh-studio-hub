// /var/www/fresh-studio-hub/src/components/MediaPickerDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MediaLibrary, {
  type MediaFile,
} from "@/pages/admin/media/MediaLibrary";

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Mime type prefixes to filter, e.g. ["image/"] */
  acceptTypes?: string[];
  /** Called when user picks a file */
  onPick: (file: MediaFile) => void;
  title?: string;
}

export default function MediaPickerDialog({
  open,
  onOpenChange,
  acceptTypes,
  onPick,
  title = "Select File",
}: MediaPickerDialogProps) {
  const handlePick = (file: MediaFile) => {
    onPick(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
          <MediaLibrary
            pickerMode
            acceptTypes={acceptTypes}
            onPick={handlePick}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}