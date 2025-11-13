"use client";
import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { UserProfileProps } from "@/types";
import { BiLike, BiDislike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentProps } from "@/types"; 
interface Props {
  variant: string;
  message: string;
  thinking?: string; // Add thinking prop
  sourceDocs?: DocumentProps[]; // Assuming sourceDocs is an array of DocumentProps
  onSourceClick: (doc: DocumentProps) => void;
  onShowScores: () => void;
  user: UserProfileProps | null;
  liked?: boolean;
  disliked?: boolean;
  rating?: any;
  handleLike: () => void;
  handleDislike: () => void;
  handleRating: (value: number, i: number) => void;
  handleUpdateMisc?: () => void;
  handleEvaluate: () => void;
  id: number;
  faithfulness?: number | null; // <-- Added property
  isEvaluating?: boolean;
}

const ChatBox = ({
  variant,
  message,
  thinking, // Add thinking to destructuring
  sourceDocs,
  user,
  liked,
  disliked,
  id,
  rating,
  handleLike,
  handleDislike,
  handleRating,
  handleUpdateMisc,
  handleEvaluate,
  onSourceClick,
  faithfulness,
  isEvaluating, // <-- Tambahin prop isEvaluating

  // answer_relevancy,
  onShowScores,
}: Props) => {
  const [showThinking, setShowThinking] = React.useState(false);
  if (variant === "request") {
    return (
      <div className="w-[60%] min-w-[400px] p-4 bg-slate-100 dark:bg-gray-800 rounded-xl mb-4 ml-auto">
        <div className="flex items-center gap-x-2">
          <Avatar className="w-6 h-6 rounded-full overflow-hidden">
            <AvatarImage
              className="object-cover"
              src={user?.img_url || "./taiwan-tech.png"}
            />
            <AvatarFallback className="text-xs">RT</AvatarFallback>
          </Avatar>
          <h2 className="text-sm font-medium">{user?.username}</h2>
        </div>
        <p className="mt-2 break-all text-blue-800 dark:text-gray-300" style={{ whiteSpace: "pre-line" }}>
          {message}
        </p>
      </div>
    );
  }

  const hasScores = faithfulness !== null && faithfulness !== undefined;
  const uniqueDocs = (sourceDocs ?? []).filter((doc, index, self) =>
    index === self.findIndex((d) => d.document_id === doc.document_id)
  );
  return (
    <div className="w-full my-1">
      <div className="flex items-center gap-x-2">
        <Avatar className="w-6 h-6 rounded-full overflow-hidden">
          <AvatarImage
            className="object-cover"
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAClklEQVR4Ab2XAWRbQRiAn5iJKGYgpqJmZmYYoqKmqmBmhmAivBiGmgqGmZqaYSYoGAaCYaaoidkdiqmpmYEZIqqeGYqZioqo8PpdHb2+vty7PEkfX+7J3d3/vbs/d3le6qsmZ2AdgPtzu2piioCvoAfhMb7o6e+mJhk4Q4Aq/IEwDl1XVW3HHFwWGfSbDpKIbltMG0xR0Pd5aHq+HMQEOuD7DtMfcH+mXvdpQl6PVYCMi8ALWNHT3o4J/AsewEWjzxXavjTywkC0dZs6rIF1nau6oxaQwemnEi3IWuRnYT8iERgCISwP63wduhaBwCXLaVNJEOjD7eiTe6zZpmpgEai7/lqgbRFQbJ/OB1/eVxVWAV/e8lwvX7yLEXgSSdKyKbCVIABieoRf0usYgaVIPm2Zax8mCUBpBIH3SQJ6Fq6pimeOAg3H4Flma89FAOpUiJaTgC+6ythxHwkdBdZVxa6LgGYHblh20McwGEHgNxWibxHYiN+CxRrlHcjDDJRBQhjD5+EC4r83pFMLLtHAI1hZP3k4IgFU6J+hzJmJaXBIAD7iB9jTU5qBLKxANzGwLw8oV3VQ+grbEb6vZuBvwoA/KedPDh2eJP50HMAHmNZti5B0hO+ohl8dzneQHykLevASfDfa/IA5Q7IJWtLKF7UEDfd1jU6vfKTQ65xlrOfmMiXDEc7NYroEEw9B9VekTdSS6nzBkiQJiAW9HGEKOsczxxW/HbuxCHMp5ZfNXSwHwTkKdCAbPcPv6sydtMAhzNsPkskKPE36S96YoMAqOL0XLHm+7I1RoAs1GOkF5SYSm2MQ+ER+XfVSXb5UIguwAX13AdHVZ8Ys5djeDy8zcIXyLWxz/48nUwIEEbuUEt7APci5DnsEpqVT/8wdlEMAAAAASUVORK5CYII="
            // size="20"
          />
          <AvatarFallback className="text-xs">TW</AvatarFallback>
        </Avatar>
        <h2 className="text-sm font-medium">Agent</h2>
      </div>
      {thinking && thinking.trim() && (
        <div className="mt-3 mb-3 p-3 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center justify-between w-full text-left"
          >
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              Thinking Process
            </span>
            <span className="text-blue-800 dark:text-blue-300">
              {showThinking ? '▼' : '▶'}
            </span>
          </button>
          {showThinking && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {thinking}
            </div>
          )}
        </div>
      )}

      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");

            return !inline && match ? (
              <SyntaxHighlighter
                style={dracula}
                PreTag="div"
                language={match[1]}
                {...props}
              >
                {String(children).replace(/\n$/, "&nbsp; \n")}
              </SyntaxHighlighter>
            ) : (
              <code className={`inline-code ${className}`} {...props}>
                {children}
              </code>
            );
          },
        }}
        // className="p-2 mt-2 leading-7 break-all text-blue-800 dark:text-white"
      >
        {message}
      </Markdown>

          {sourceDocs && sourceDocs.length > 0 && (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
          Documents Source:
        </h4>
        <div className="flex flex-wrap gap-2">
          {uniqueDocs.map((doc, index) => (
            <button
              key={`${doc.document_id}-${index}`}
              onClick={() => onSourceClick(doc)} // <-- Panggil fungsi dari props
              className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-left"
              title={doc.document_name}
            >
              {doc.document_name}
            </button>
          ))}
        </div>
      </div>
    )}

      <div className="mb-5 flex ">
        <Button
          variant="ghost"
          onClick={handleLike}
          className="mr-[5px] px-[5px] py-[5px] h-[35px]"
        >
          {liked ? (
            <BiSolidLike className="text-blue-700 dark:text-gray-300 cursor-pointer" size={15} />
          ) : (
            <BiLike className="text-blue-700 dark:text-gray-300 cursor-pointer" size={15} />
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDislike}
          className="mr-[5px] px-[5px] py-[5px] h-[35px]"
        >
          {disliked ? (
            <BiSolidDislike
              className="text-blue-700 dark:text-gray-300 cursor-pointer"
              size={15}
            />
          ) : (
            <BiDislike className="text-blue-700 dark:text-gray-300 cursor-pointer" size={15} />
          )}
        </Button>
        <Select onValueChange={(value) => handleRating(value as any, id)}>
          <SelectTrigger className="mx-[5px] w-[60px] h-[35px] dark:text-gray-300">
            <SelectValue placeholder={rating} />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((j) => (
              <SelectItem key={j} value={j.toString()}>
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="mx-[5px] h-[35px] dark:text-gray-300"
          onClick={handleUpdateMisc}
        >
          Update
        </Button>




      {isEvaluating && (
        <Button variant="ghost" disabled className="mx-[5px] h-[35px] text-gray-500">
          {/* Ganti ini pake ikon spinner dari library lo, misal lucide-react */}
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Evaluating...
        </Button>
      )}

      {/* STATE 2: Kalo GAK lagi loading DAN SUDAH ada skor, tampilin tombol "Eval Results" */}
      {!isEvaluating && hasScores && (
        <Button
          variant="ghost"
          className="mx-[5px] h-[35px] dark:text-gray-300"
          onClick={onShowScores}
        >
          Eval Results
        </Button>
      )}

      {/* STATE 3: Kalo GAK lagi loading DAN BELUM ada skor, tampilin tombol "Evaluate" */}
      {!isEvaluating && !hasScores && (
        <Button
          variant="ghost"
          className="mx-[5px] h-[35px] dark:text-gray-300"
          onClick={handleEvaluate}
          // disabled={item.message_id.startsWith('ai-')}
        >
          Evaluate Docs Retrieval
        </Button>
      )}




      </div>
    </div>
  );
};

export default ChatBox;
