"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import PaginationTable from "./pagination-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { BsChevronExpand } from "react-icons/bs";
import { FaRegFilePdf } from "react-icons/fa6";
import { SiObsidian } from "react-icons/si";
import { FiFileText } from "react-icons/fi";
import ActionsOption from "./action-options";
import FilterTable from "./filter-table";
import { TableContentProps } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import {
  generateDashboardDocumentsLink,
  updateDocumentMetadata,
} from "@/lib/utils";
import useClickOutside from "@/lib/useClickOutside";
import { Input } from "@/components/ui/input";
import { table } from "console";

const DocTable = () => {
  const [tableContents, setTableContents] = useState<TableContentProps[]>([]);
  const [selectedItems, setSelectedItems] = useState<TableContentProps[]>([]);
  const [totalItems, setTotalItems] = useState<number>();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<string>("-1");
  const [inputTitle, setInputTitle] = useState<string>("");
  const [inputTopic, setInputTopic] = useState<string>("");
  const { userId } = useAuth();
  const searchParams = useSearchParams();

  const searchTerm = searchParams.get("searchTerm");
  const tags = useMemo(() => searchParams.getAll("tag"), [searchParams]);
  const paginationIndex = Number(searchParams.get("page")) || 0;
  const rowsPerPage = Number(searchParams.get("n")) || 10;
  const targetRef = useRef<HTMLDivElement>(null);
  const targetRef2 = useRef<HTMLDivElement>(null);
  const targetRef3 = useRef<HTMLDivElement>(null);

useClickOutside(
  () => setEditingCell("-1"),
  targetRef as React.RefObject<HTMLElement>,
  targetRef2 as React.RefObject<HTMLElement>,
  targetRef3 as React.RefObject<HTMLElement>
);

  useEffect(() => {
    if (!userId) {
    return; // Keluar dari useEffect kalo userId belum siap
   }
    setIsLoading(true);
    fetch(
      generateDashboardDocumentsLink(
        "be",
        userId,
        paginationIndex * rowsPerPage,
        rowsPerPage,
        searchTerm,
        tags
      )
    ).then(async (res) => {
      if (!res.ok) {
        setError("An error has occured when fetching the data");
      }
      const newData = await res.json();
      setTableContents(newData.data.list);
      setTotalItems(newData.data.docCounts);
    }).finally(() => setIsLoading(false));
  }, [paginationIndex, rowsPerPage, searchTerm, tags, userId]);

  useEffect(() => {
    if (editingCell !== "-1") {
      // 1. Use .find() to efficiently locate the item
      const itemToEdit = tableContents.find((item) => item.id === editingCell);

      // 2. Update the state if the item is found
      if (itemToEdit) {
        setInputTitle(itemToEdit.title);
        setInputTopic(itemToEdit.topic);
      }
    }
  }, [editingCell, tableContents]);

  const handleUpdateMisc = (documentId: string) => {
    const newContents = tableContents.map((item) =>
      item.id === documentId
        ? { ...item, title: inputTitle, topic: inputTopic }
        : item
    );
    setTableContents(newContents);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    documentId: string,
    isPublic: Boolean
  ) => {
    if (e.key === "Enter") {
      updateDocumentMetadata(
        documentId,
        inputTitle,
        inputTopic,
        isPublic,
        false
      );
      setEditingCell("-1");
      handleUpdateMisc(documentId);
    }
  };

  const selectAllContents = () => {
    if (selectedItems.length === tableContents.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(tableContents);
    }
  };

  const selectContent = (content: TableContentProps) => {
    const elementIndex = selectedItems.indexOf(content);

    if (elementIndex === -1) {
      const newSelectedItems = [...selectedItems, content];
      setSelectedItems(newSelectedItems);
    } else {
      const newSelectedItems = selectedItems.filter(
        (_, index) => index !== elementIndex
      );
      setSelectedItems(newSelectedItems);
    }
  };


  if (isLoading) {
    return (
      <div className="w-full h-full text-center">Fetching the data...</div>
    );
  }
  return (
    <>
      <FilterTable />
      <div className="max-h-[calc(100%-136px)] relative overflow-auto border rounded-md">
        <Table>
          <TableHeader className="sticky w-full top-0 bg-background dark:bg-card z-40">
            <TableRow className="text-xs">
              <TableHead className="flex items-center">
                <Checkbox
                  checked={
                    selectedItems.length === tableContents.length &&
                    tableContents.length !== 0
                  }
                  onClick={selectAllContents}
                  className="mr-3"
                />
                <Button variant={"ghost"} size={"sm"} className="px-2">
                  <span className="text-xs">Title</span>
                  <BsChevronExpand className="ml-2" size={12} />
                </Button>
              </TableHead>
              <TableHead>Tag</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>
                <Button variant={"ghost"} size={"sm"} className="px-2">
                  <span className="text-xs">Size</span>
                  <BsChevronExpand className="ml-2" size={12} />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant={"ghost"} size={"sm"} className="px-2">
                  <span className="text-xs">Date Added</span>
                  <BsChevronExpand className="ml-2" size={12} />
                </Button>
              </TableHead>
              <TableHead>Shared</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableContents.length !== 0 ? tableContents.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="flex-col">
                  <div className="flex font-medium items-center">
                    <Checkbox
                      key={i}
                      onClick={() => selectContent(item)}
                      checked={selectedItems?.indexOf(item) !== -1}
                      className="mr-3"
                    />
                    {item.tag === "pdf" ? (
                      <FaRegFilePdf size={16} className="mr-2" />
                    ) : item.tag === "txt" ? (
                      <FiFileText size={16} className="mr-2" />
                    ) : (
                      <SiObsidian size={16} className="mr-2" />
                    )}
                    <div
                      ref={targetRef}
                      onDoubleClick={() => setEditingCell(item.id)}
                    >
                      {editingCell === item.id ? (
                        <Input
                          className="w-25 h-7 p-1"
                          type="text"
                          defaultValue={item.title}
                          placeholder="text"
                          onChange={(e) => setInputTitle(e.target.value)}
                          onKeyDown={(e) =>
                            handleKeyDown(e, item.id, item.public)
                          }
                        />
                      ) : (
                        item.title
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="flex-col">
                  <Badge
                    variant={"default"}
                    className="bg-blue-700 border-none hover:bg-blue-700"
                  >
                    {item.tag}
                  </Badge>
                </TableCell>
                <TableCell className="flex-col">
                  <div
                    ref={targetRef2}
                    onDoubleClick={() => setEditingCell(item.id)}
                  >
                    {editingCell === item.id ? (
                      <Input
                        className="w-25 h-6 p-1"
                        type="text"
                        defaultValue={item.topic}
                        placeholder="text"
                        onChange={(e) => setInputTopic(e.target.value)}
                        onKeyDown={(e) =>
                          handleKeyDown(e, item.id, item.public)
                        }
                      />
                    ) : (
                      item.topic
                    )}
                  </div>
                </TableCell>
                <TableCell className="flex-col">
                  {item.file_size_formatted}
                </TableCell>
                <TableCell className="flex-col">{item.createdAt}</TableCell>
                <TableCell className="flex-col">
                  {item.public === true ? (
                    <Badge
                      variant={"outline"}
                      className="border-blue-200 bg-blue-100 font-medium"
                    >
                      Shared
                    </Badge>
                  ) : (
                    <Badge
                      variant={"outline"}
                      className="border-red-200 bg-red-200 font-medium"
                    >
                      Not Shared
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="flex-col">
                  <div ref={targetRef3}>
                    <ActionsOption
                      documentId={item.id}
                      isPublic={item.public === true}
                      tag={item.tag}
                      title={item.title}
                      topic={item.topic}
                      tableContents={tableContents}
                      setTableContents={setTableContents}
                      editingCell={editingCell}
                      setEditingCell={setEditingCell}
                      inputTitle={inputTitle}
                      inputTopic={inputTopic}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
            : 
            (
              <TableRow>
                <TableCell colSpan={6}>
                  <p className="text-muted-foreground text-sm italic flex justify-center">
                    No documents found
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationTable
        selectedItems={selectedItems}
        tableContents={tableContents}
        rowsPerPage={rowsPerPage}
        searchTerm={searchTerm}
        tags={tags}
        paginationIndex={paginationIndex}
        totalItems={totalItems || 1}
      />
      <p className="text-red-700 w-full text-center py-4 text-sm">{error}</p>
    </>
  );
};

export default DocTable;
