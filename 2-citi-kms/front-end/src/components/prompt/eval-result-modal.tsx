"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MessageProps } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scores: MessageProps | null;
}

const EvalResultModal = ({ isOpen, onClose, scores }: Props) => {
  if (!scores) return null;

    return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Evaluation Results</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">

          {/* -- Faithfulness -- */}
          <div>
            <div className="flex justify-between items-center">
              <dt className="font-semibold">Faithfulness</dt>
              <dd className="font-mono text-sm">{scores.faithfulness?.toFixed(4) || 'N/A'}</dd>
            </div>
            <DialogDescription className="text-xs">
              How faithful is the answer to the provided sources? (Anti-hallucination score)
            </DialogDescription>
          </div>

          {/* -- Answer Relevancy -- */}
          <div>
            <div className="flex justify-between items-center">
              <dt className="font-semibold">Answer Relevancy</dt>
              <dd className="font-mono text-sm">{scores.answer_relevancy?.toFixed(4) || 'N/A'}</dd>
            </div>
            <DialogDescription className="text-xs">
              Is the answer relevant and directly address the question?
            </DialogDescription>
          </div>
          
          {/* -- Context Precision -- */}
          <div>
            <div className="flex justify-between items-center">
              <dt className="font-semibold">Context Precision</dt>
              <dd className="font-mono text-sm">{scores.context_precision?.toFixed(4) || 'N/A'}</dd>
            </div>
            <DialogDescription className="text-xs">
              Were all of the retrieved sources actually useful for the answer? (Signal-to-noise score)
            </DialogDescription>
          </div>

          {/* -- Context Relevance -- */}
          <div>
            <div className="flex justify-between items-center">
              <dt className="font-semibold">Context Relevance</dt>
              <dd className="font-mono text-sm">{scores.context_relevance?.toFixed(4) || 'N/A'}</dd>
            </div>
            <DialogDescription className="text-xs">
              How relevant are the retrieved sources to the question?
            </DialogDescription>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvalResultModal;