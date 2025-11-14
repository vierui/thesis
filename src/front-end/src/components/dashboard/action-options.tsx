import React, { Dispatch, RefObject, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { PiDotsThreeOutlineFill } from "react-icons/pi";
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
import { BsPencil } from "react-icons/bs";
import Link from "next/link";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { FiDelete } from "react-icons/fi";
import { MdOutlineFileDownload } from "react-icons/md";
import { TableContentProps } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { RiGlobalLine } from "react-icons/ri";
import { NextResponse } from "next/server";
import { toast } from "sonner";
import { FaCheck } from "react-icons/fa";
import {
  updateDocumentMetadata,
  deleteDocumentFromVDB,
  insertDocumentToVDB,
  deleteDocument,
} from "@/lib/utils";

interface SuccessToastProp {
  msg: string;
}

type Props = {
  documentId: string;
  isPublic: Boolean;
  tag: string;
  title: string;
  topic: string;
  tableContents: TableContentProps[];
  setTableContents: Dispatch<TableContentProps[]>;
  editingCell: string;
  setEditingCell: Dispatch<string>;
  inputTitle: string;
  inputTopic: string;
};

const ActionsOption = ({
  documentId,
  isPublic,
  tag,
  title,
  topic,
  tableContents,
  setTableContents,
  editingCell,
  setEditingCell,
  inputTitle,
  inputTopic,
}: Props) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false);
  const { userId } = useAuth();

  const showToast = (promise: Promise<string>) => {
    toast.promise(promise, {
      loading: "Your file is being moved to other collections",
      success: (msg) => msg,
      error: "Error during moving the file",
    });
  };

  const handleClickInsideChild = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation(); // Stop propagation to parent components
    console.log("Clicked inside child");
    // Handle other logic as needed
  };

  const handleUpdateMisc = () => {
    const newContents = tableContents.map((item) =>
      item.id === documentId
        ? { ...item, title: inputTitle, topic: inputTopic }
        : item
    );
    setTableContents(newContents);
  };

  const deletingDocument = async () => {
    try {
      await deleteDocument(documentId?.toString(), userId?.toString());
      const newContents = tableContents.filter(
        (item) => item.id !== documentId
      );
      setTableContents(newContents);
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  const switchToCollections = async (
    isPublic: Boolean,
    tag: string,
    title: string,
    topic: string
  ) => {
    await deleteDocumentFromVDB(documentId, isPublic ? "public" : "private");

    await insertDocumentToVDB(
      documentId,
      userId,
      tag,
      isPublic ? "public" : "private",
      true
    );

    await updateDocumentMetadata(documentId, title, topic, isPublic, true);

    const newData = [...tableContents];
    const index = newData.findIndex((item) => item.id === documentId);

    if (index !== -1) {
      newData[index] = {
        ...newData[index],
        public: !isPublic,
      };

      setTableContents(newData);
    }

    return `Document has been moved to ${
      isPublic ? "private" : "public"
    } collections.`;
  };

  if (editingCell !== documentId) {
    return (
      <>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deletingDocument}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size={"sm"}
              variant={"ghost"}
              className="flex items-center gap-[3px] w-[25px] h-[25px] p-0"
            >
              <PiDotsThreeOutlineFill />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-32 right-0" align="end">
            <div className="p-1">
              <Button
                size={"sm"}
                className="w-full text-xs h-7 rounded justify-between font-normal"
                variant={"ghost"}
                onClick={() => {
                  editingCell === "-1"
                    ? setEditingCell(documentId)
                    : setEditingCell("-1");
                  setIsOpen(false);
                }}
              >
                Edit <BsPencil className="text-muted-foreground" size={13} />
              </Button>
              <Link href={`/api/document?id=${documentId}&tag=${tag}`}>
                <Button
                  size={"sm"}
                  className="w-full text-xs h-7 rounded justify-between font-normal"
                  variant={"ghost"}
                >
                  Download{" "}
                  <MdOutlineFileDownload
                    className="text-muted-foreground"
                    size={13}
                  />{" "}
                </Button>
              </Link>
              <Button
                size={"sm"}
                className="w-full text-xs h-7 rounded justify-between font-normal"
                variant={"ghost"}
                onClick={() =>
                  showToast(switchToCollections(isPublic, tag, title, topic))
                }
              >
                Publicize{" "}
                <RiGlobalLine className="text-muted-foreground" size={13} />
              </Button>
              <Separator className="my-1" />
              <Button
                size={"sm"}
                className="w-full text-red-500 hover:text-red-500 text-xs h-7 rounded justify-between font-normal"
                variant={"ghost"}
                onClick={() => setIsAlertOpen(true)}
              >
                Delete <FiDelete size={13} />
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </>
    );
  } else {
    return (
      <div onClick={handleClickInsideChild}>
        <Button
          className="bg-blue-700"
          style={{ width: "50px", height: "24px" }}
          onClick={async () => {
            updateDocumentMetadata(
              documentId,
              inputTitle,
              inputTopic,
              isPublic,
              false
            );
            setEditingCell("-1");
            handleUpdateMisc();
          }}
        >
          <FaCheck size={12} />
        </Button>
      </div>
    );
  }
};

export default ActionsOption;
