"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DocumentProps } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentProps | null;
}

const SourceDetailModal = ({ isOpen, onClose, doc }: Props) => {
  if (!doc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{doc.document_name}</DialogTitle>
          <DialogDescription>
            Page {doc.page_number} | Source: {doc.source}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-gray-800 rounded-md my-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {doc.content}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SourceDetailModal;