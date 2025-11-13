import React, { useState, useEffect } from "react";
import { useSession } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const SessionDialog = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { isLoaded, session, isSignedIn } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn && isSignedIn !== undefined) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isSignedIn]);

  return (
    <Dialog open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Timeout</DialogTitle>
          <DialogDescription>
            Your session is expired. Please sign in again.
          </DialogDescription>
          <DialogFooter className="justify-end">
            <Button onClick={() => router.push("/sign-in")} variant="ghost">
              Sign In
            </Button>
          </DialogFooter>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDialog;
