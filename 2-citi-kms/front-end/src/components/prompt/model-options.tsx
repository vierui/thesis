"use client";
import React  from "react";
import { Button } from "../ui/button";
import { useHasMounted } from "@/hooks/useHasMounted";
import { llmModels } from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Props {
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  isHydeChecked: boolean;
  setIsHydeChecked: (value: boolean) => void;
  isRerankingChecked: boolean;
  setIsRerankingChecked: (value: boolean) => void;
  isUltrathinkChecked: boolean;
  setIsUltrathinkChecked: (value: boolean) => void;
  temperatures: number;
  setTemperature: (value: number) => void;
}

const ModelOptions = ({
  selectedModel,
  setSelectedModel,
  isHydeChecked,
  setIsHydeChecked,
  isRerankingChecked,
  setIsRerankingChecked,
  isUltrathinkChecked,
  setIsUltrathinkChecked,
  temperatures,
  setTemperature,
}: Props) => {
  const hasMounted = useHasMounted();

  const handleHydeChange = (checked: boolean) => {
    setIsHydeChecked(checked);
  };

  const handleRerankingChecked = (checked: boolean) => {
    setIsRerankingChecked(checked);
  };

  const handleUltrathinkChecked = (checked: boolean) => {
    setIsUltrathinkChecked(checked);
  };

  if (!hasMounted) {
    return (
      <Button
        disabled
        className="h-fit px-4 py-2 rounded-xl border bg-white text-blue-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 shadow-none hover:shadow-blue-200 dark:hover:shadow-gray-500"
      >
        Options
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-fit px-4 py-2 rounded-xl border bg-white text-blue-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 shadow-none hover:shadow-blue-200 dark:hover:shadow-gray-500"
        >
          Options
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-800 dark:text-gray-300">
        <DialogHeader>
          <DialogTitle className="flex justify-center">
            Model Options
          </DialogTitle>
          <DialogDescription className="flex justify-center items-center">
            Make changes for model options. Click save for changes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right dark:text-gray-300">Model Name</Label>
            <Select onValueChange={(val) => setSelectedModel(val)}>
              <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:text-gray-300">
                <SelectValue placeholder={selectedModel} />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-700 dark:text-gray-300">
                <SelectGroup>
                  {llmModels.map((item) => (
                    <SelectItem value={item.name} key={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right dark:text-gray-300">Hyde</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="airplane-mode"
                checked={isHydeChecked}
                onCheckedChange={handleHydeChange}
                className="bg-blue-700"
              />
              <p>{isHydeChecked ? "ON" : "OFF"}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right dark:text-gray-300">Reranking</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="reranking-mode"
                checked={isRerankingChecked}
                onCheckedChange={handleRerankingChecked}
              />
              <p>{isRerankingChecked ? "ON" : "OFF"}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right dark:text-gray-300">Ultrathink</Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="ultrathink-mode"
                checked={isUltrathinkChecked}
                onCheckedChange={handleUltrathinkChecked}
              />
              <p>{isUltrathinkChecked ? "ON" : "OFF"}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right dark:text-gray-300">Temperature</Label>
            <Input
              type="number"
              value={temperatures}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="col-span-3 focus:ring-blue-700 dark:bg-gray-700 dark:text-gray-300 dark:focus:ring-gray-500"
              min="0"
              max="1"
              step="0.01"
            />
          </div>
        </div>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelOptions;
