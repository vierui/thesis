import React, { useEffect, useState } from "react";
import { BsTags } from "react-icons/bs";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import CommandOption from "./command-option";
import UploadCard from "./upload-card";
import { useSearchParams, useRouter } from "next/navigation";

// APIS
import { accumulatedSizeOfDocuments } from "@/lib/document-queries";
import { useAuth } from "@clerk/nextjs";
import { generateDashboardDocumentsLink } from "@/lib/utils";

const dummyTags = ["pdf", "txt", "md"];

const FilterTable = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>(searchParams.getAll("tag"));
  const [storageSize, setStorageSize] = useState<number>(0);
  const LIMIT_STORAGE_SIZE = 25;
  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.get("searchTerm") || ""
  );

  const paginationIndex = Number(searchParams.get("page")) || 0;
  const rowsPerPage = Number(searchParams.get("n")) || 10;

  const chooseTag = (newTag: string) => {
    const tagIndex = tags.indexOf(newTag);
    let newTags: string[];

    if (tagIndex === -1) {
      newTags = [...tags, newTag];
      setTags(newTags);
    } else {
      newTags = tags.filter((_, index) => index !== tagIndex);
      setTags(newTags);
    }
  };

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
  };

  const onSearchEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      router.push(
        generateDashboardDocumentsLink(
          "client",
          "",
          paginationIndex,
          rowsPerPage,
          searchTerm,
          tags
        )
      );
    }
  };

  const clearTags = () => {
    setOpen(!open);
    setTags([]);
    router.push(
      generateDashboardDocumentsLink(
        "client",
        "",
        paginationIndex * rowsPerPage,
        rowsPerPage,
        searchTerm,
        []
      )
    );
  };

  const handleApplyTags = () => {
    router.push(
      generateDashboardDocumentsLink(
        "client",
        "",
        paginationIndex * rowsPerPage,
        rowsPerPage,
        searchTerm,
        tags
      )
    );
  };

  useEffect(() => {
    accumulatedSizeOfDocuments(userId || "")
      .then((res) => setStorageSize(res || 0))
      .catch((err) => console.log(err));
  }, [userId]);

  return (
    <div className="flex items-center mb-5 justify-between">
      <div className="flex items-center">
        <Input
          onKeyDown={onSearchEnter}
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search a title or a topic..."
          className="h-8 md:w-64"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild className="border border-dashed">
            <Button
              variant={"ghost"}
              role="combobox"
              className="h-8 text-xs mx-3 shadow border border-dashed"
            >
              <BsTags size={12} className="mr-2" />
              Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <CommandOption
              placeholder="Search tags..."
              options={dummyTags}
              selectedOptions={tags}
              onClickItems={chooseTag}
              type="checkbox"
              clearTags={clearTags}
              applyTags={handleApplyTags}
            />
          </PopoverContent>
        </Popover>
        <UploadCard />
      </div>
      <div className="flex flex-col text-xs items-center text-muted-foreground gap-y-2 font-medium">
        <Progress
          value={storageSize}
          max={LIMIT_STORAGE_SIZE}
          indicatorColor="bg-blue-700"
          className="w-48"
        />
        Storage {storageSize} GB of {LIMIT_STORAGE_SIZE} GB used
      </div>
    </div>
  );
};

export default FilterTable;
