import React, { useState } from "react";
import { PiDotsThreeOutlineFill } from "react-icons/pi";
import { FiDelete, FiArchive } from "react-icons/fi";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { Button } from "../ui/button";
import { useHasMounted } from "@/hooks/useHasMounted";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "../ui/alert-dialog";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/useStore";
import { usePathname } from "next/navigation";

interface ChildProps {
  id: string;
  enableRename: () => void;
}

const ThreeDotSidebar: React.FC<ChildProps> = ({ id, enableRename }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const idOnPath = pathname.split("/")[2];

  const triggerFunction = useStore((state) => state.triggerFunction);

  const deleteChatBox = async () => {
    fetch(`/api/chatbox?id=${id}`, { method: "DELETE" }).then((res) => {
      if (!res.ok) {
        console.log("Error occurred");
        return;
      }

      triggerFunction();
      router.push("/prompt");
    });
    setIsOpen(!isOpen);
  };

  const renameChatBox = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    enableRename();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <HoverCard openDelay={300}>
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen)}}
              variant={"ghost"}
              className={`rounded-lg h-fit p-[3px] hover:bg-white hover:text-blue-700 border-none group-hover:block ${id === idOnPath || isOpen ? "block" : "hidden"}`}>
              <PiDotsThreeOutlineFill />
            </Button>
          </PopoverTrigger>
        </HoverCardTrigger>
        <HoverCardContent hideWhenDetached className="z-40 p-1 bg-white text-blue-700 w-fit border-none shadow shadow-blue-400 rounded-md mt-2">
          <p className="text-xs">More</p>
        </HoverCardContent>
      </HoverCard>
      <PopoverContent hideWhenDetached className="w-32 p-0 text-blue-700 dark:text-blue-300 rounded-xl overflow-hidden" align="end">
        <Button
          onClick={renameChatBox}
          variant={"ghost"}
          className="px-4 w-full rounded-none justify-between dark:text-blue-300"
          size={"sm"}
        >
          Rename <MdDriveFileRenameOutline className="dark:text-blue-300" />
        </Button>
        <Separator />
        <DeleteAlert deleteFunction={deleteChatBox} />
      </PopoverContent>
    </Popover>
  );
};

interface AlertProps {
  deleteFunction: () => Promise<void>;
}

const DeleteAlert = ({ deleteFunction }: AlertProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const hasMounted = useHasMounted();

  const handleDelete: React.MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    event.stopPropagation();
    await deleteFunction();
  };

  const handleClickOpen = (e: React.MouseEvent<HTMLElement>) => {
    setIsOpen(!isOpen);
    e.stopPropagation();
  };

  if (!hasMounted) {
    return (
      <Button
        disabled
        variant={"ghost"}
        className="px-4 w-full rounded-none justify-between text-red-500"
        size={"sm"}
      >
        Delete <FiDelete />
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          onClick={handleClickOpen}
          variant={"ghost"}
          className="px-4 w-full rounded-none justify-between text-red-500"
          size={"sm"}
        >
          Delete <FiDelete />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will permanently delete the selected chat.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={(e) => {e.stopPropagation(); setIsOpen(false)}}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-700 dark:text-white text-white dark:hover:text-red-500 hover:text-red-500"
            onClick={handleDelete}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export default ThreeDotSidebar;
