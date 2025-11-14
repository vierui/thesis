import React, { useState } from "react";
import { FiUpload } from "react-icons/fi";
import {
  Card,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAuth } from "@clerk/nextjs";

interface SuccessToastProp {
  msg: string;
}

const SuccessToast = ({ msg }: SuccessToastProp) => {
  return (
    <div className="w-full">
      <p className="text-sm font-semibold">{msg}</p>
      <p className="text-sm">Refresh the page to see the file</p>
      <div className="w-full flex justify-end">
        <Button
          onClick={() => window.location.reload()}
          size={"sm"}
          className="bg-blue-700"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};

const UploadCard = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { userId } = useAuth();
  const [selectedParser, setSelectedParser] = useState<string>("pymu");

  const showToast = (promise: Promise<string>) => {
    toast.promise(promise, {
      loading: "Your file is being uploaded",
      success: (msg) => {
        return <SuccessToast msg={msg} />;
      },
      error: "Error when uploading the file",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadDocument = () => {
    if (!selectedFile || title === "" || topic === "") {
      setError("Fill all the required fields");
      return;
    }
    setIsOpen(false);

    // form data definition
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("topic", topic);
    formData.append("user_id", userId || "");
    formData.append("parser", selectedParser);

    const upload = async () => {
      try {
        const res = await fetch("/api/document", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error();
        }
        return "The file has been uploaded";
      } catch (error) {
        throw new Error();
      }
    };

    showToast(upload());

    setSelectedFile(null);
    setTitle("");
    setTopic("");
    setSelectedParser("pymu");
  };

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button variant={"outline"} className="text-xs h-8 shadow">
          <FiUpload size={12} className="mr-2" />
          Upload
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-fit border-none" align="start">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-base">Add a new document</CardTitle>
            <CardDescription className="text-sm">
              Fill the required document informations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="document">Upload Document</Label>
                  <Input
                    type="file"
                    className="cursor-pointer"
                    onChange={handleFileChange}
                  ></Input>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="Document Name">Document Name</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    type="text"
                    placeholder="Name of your document"
                  ></Input>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="Document Topic">Document Topic</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    type="text"
                    placeholder="Topic of your document"
                  ></Input>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="parser">Document Parser</Label>
                  <select
                    id="parser"
                    value={selectedParser}
                    onChange={(e) => setSelectedParser(e.target.value)}
                    className="h-10 px-3 py-2 text-sm border rounded-md bg-white dark:bg-zinc-900 text-black dark:text-white"
                  >
                    <option value="pymu">PyMu (Default)</option>
                    <option value="docling">Docling</option>
                    <option value="mineru">MinerU</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-red-500 mt-2">{error}</p>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button variant={"default"} size={"sm"} onClick={uploadDocument}>
              Upload
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default UploadCard;
