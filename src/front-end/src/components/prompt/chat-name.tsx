import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FaCheck } from "react-icons/fa";
import useClickOutside from "@/lib/useClickOutside";
import ThreeDotSidebar from "./three-dot-sidebar";

type Props = {
  id: string;
  name: string;
};

const ChatName = ({ id, name }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const idOnPath = pathname?.split("/")[2];

  const [chatName, setChatName] = useState<string>(name);
  const [inputName, setInputName] = useState<string>(name);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const navigateToChat = () => {
    router.push(`/prompt/${id}`);
  };

  const updateChatName = async () => {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("name", inputName);

    try {
      await fetch('/api/chatbox', {
        method: "PUT",
        body: formData,
      });
      setChatName(inputName);
      setIsRenaming(false);
    } catch (error) {
      console.error("Error:", error);
    }
    return void 0;
  };

useClickOutside(() => setIsRenaming(false), targetRef as React.RefObject<HTMLElement>);
  useEffect(() => setChatName(name), [name]);

  return (
    <>
      {!isRenaming ? (
        <div
          onClick={navigateToChat}
          className={`my-1 px-3 py-[10px] text-sm rounded-xl cursor-pointer hover:bg-blue-600 dark:hover:bg-gray-600 flex justify-between items-center w-full relative group ${
            id === idOnPath &&
            "bg-blue-600 dark:bg-gray-600 hover:bg-blue-600 dark:hover:bg-gray-600"
          }`}
        >
          {chatName}
          <ThreeDotSidebar id={id} enableRename={() => setIsRenaming(true)} />
        </div>
      ) : (
        <div
          className={`my-1 rounded-md w-full px-0.5 flex items-center gap-x-2`}
          ref={targetRef}
        >
          <input
            defaultValue={chatName}
            className={`w-full outline-none rounded-lg text-blue-700 px-2 py-2 text-sm`}
            onChange={(e) => setInputName(e.target.value)}
          />
          <Button
            className="rounded-lg bg-white text-blue-700 hover:shadow hover:shadow-blue-400 hover:bg-white"
            size={"sm"}
            onClick={updateChatName}
          >
            <FaCheck />
          </Button>
        </div>
      )}
    </>
  );
};

export default ChatName;
