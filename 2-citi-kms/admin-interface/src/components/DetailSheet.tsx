import React from 'react'
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { CalendarIcon, CubeIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Doc } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

const DetailSheet = ({ doc }: { doc: Doc }) => {
  return (
    <Sheet>
    <SheetTrigger asChild>
        <Button className='items-center text-xs gap-x-2 w-full justify-start font-normal hover:text-blue-700 text-neutral-900' variant={"ghost"} size={"sm"}>
            <InfoCircledIcon/> Details
        </Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
            <SheetTitle className='text-wrap'>{ doc.title }</SheetTitle>
            <SheetDescription>
            The details of this file or document
            </SheetDescription>
      </SheetHeader>
        <div className="flex flex-col justify-start gap-4 mt-10">
            <div className="flex flex-col">
                <Label>Title</Label>
                <h3 className='text-sm'>{ doc.title }</h3>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Tag</Label>
                <h3 className='text-sm'>{ doc.tag }</h3>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Topic</Label>
                <h3 className='text-sm'>{ doc.topic }</h3>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Original Name</Label>
                <h3 className='text-sm'>{ doc.originalName }</h3>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Repository Type</Label>
                <h3 className='text-sm'>{ "Public" }</h3>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Size</Label>
                <h3 className='text-sm'>{ doc.size } MB</h3>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Location</Label>
                <div className="flex items-center gap-2">
                    <CubeIcon/>
                    <h3 className='text-sm'>{ "public/" + doc.ownerId }</h3>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Owner</Label>
                <div className="flex items-center gap-4">
                    <Avatar className='h-7 w-7' >
                        <AvatarImage src={doc.ownerImgUrl} alt='user_img'/>
                        <AvatarFallback>{ doc.ownerName[0] + doc.ownerName[1] }</AvatarFallback>
                    </Avatar>
                    <h3 className='text-sm'>{ doc.ownerName }</h3>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Date Created</Label>
                <div className="flex items-center gap-2">
                    <CalendarIcon/>
                    <h3 className='text-sm'>{ doc.createdAt }</h3>
                </div>
            </div>
            <div className="flex flex-col gap-1">
                <Label>Date Modified</Label>
                <div className="flex items-center gap-2">
                    <CalendarIcon/>
                    <h3 className='text-sm'>{ doc.createdAt }</h3>
                </div>
            </div>
        </div>
    </SheetContent>
  </Sheet>
  )
}

export default DetailSheet