import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmDialog = ({ isOpen, onClose, onConfirm }: LogoutConfirmDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-3xl border-border bg-background/80 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">End Session?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You will need to log in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
