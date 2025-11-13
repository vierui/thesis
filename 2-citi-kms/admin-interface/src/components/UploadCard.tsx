import React, { useState } from 'react'
import { Card, CardTitle, CardContent, CardDescription, CardFooter, CardHeader } from './ui/card'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { UploadIcon } from '@radix-ui/react-icons'
import { useDocsStore } from '@/lib/useStore'
import { toastError, toastSuccess, toastLoading } from '@/lib/useToast'
import { useMediaQuery } from 'react-responsive'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'

const UploadCard = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedBulkFiles, setSelectedBulkFiles] = useState<FileList | null>(null)
    const [title, setTitle] = useState<string>("")
    const [topic, setTopic] = useState<string>("")
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

    const { docs, setDocs } = useDocsStore()
    const isMobile = useMediaQuery({ maxWidth: 767 })

    // functions
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        console.log(files);
        
        if (files && files.length === 1) setSelectedFile(files[0])
        else if (files) setSelectedBulkFiles(files)
    }

    const handleCancel = () => {
        setSelectedFile(null);
        setSelectedBulkFiles(null)
        setTitle('')
        setTopic('')
        setError('')
        setIsOpen(!isOpen)
        setIsSheetOpen(!isSheetOpen)
    }

    const uploadDocument = async () => {
        if (!selectedFile || title === "" || topic === "") {
            setError("Fill all the required fields")
            return
        }

        setIsOpen(false)
        setIsSheetOpen(false)

        // It returns the close method
        const closeToastLoading = toastLoading("Uploading File", "This may take a while")

        // Form data definition
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', title)
        formData.append('topic', topic)

        // Upload
        const res = await fetch('/api/documents', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()

        // Close loading toast
        closeToastLoading()

        if (!res.ok) toastError(data.message, "Upload Error", true)
        else {
            setDocs([data.payload, ...docs])            
            toastSuccess(data.message, "Upload Success")
        }

        setError('')
        setTitle('')
        setTopic('')
        setSelectedFile(null)
        setSelectedBulkFiles(null)
    }

    const handleBulkUpload = async () => {
        if (!selectedBulkFiles || topic === "") {
            setError("Fill all the required fields")
            return
        }

        setIsOpen(false)
        setIsSheetOpen(false)

        // It returns the close method
        const closeToastLoading = toastLoading(`Uploading ${selectedBulkFiles.length} files`, "This may take a while")

        // Form data definition
        const formData = new FormData()
        
        for (let i=0; i<selectedBulkFiles.length; i++) {
            formData.append("file", selectedBulkFiles[i])
        }

        formData.append("topic", topic)

        const res = await fetch('/api/documents/bulk-upload', {
            method: 'POST',
            body: formData
        })

        const data = await res.json()

        if (!res.ok) toastError(data.message, "Upload Error", true)
        else {
            setDocs([...data.payload, ...docs])            
            toastSuccess(data.message, "Upload Success")
        }
        
        closeToastLoading()

        setError('')
        setTitle('')
        setTopic('')
        setSelectedFile(null)
        setSelectedBulkFiles(null)

    }

  if (isMobile) {
    return (
        <Sheet open={isSheetOpen} onOpenChange={handleCancel}>
            <SheetTrigger asChild>
                <Button variant={"outline"} className='w-full sm:w-fit text-xs h-8 shadow gap-x-2'>
                <UploadIcon/>
                Upload
            </Button>
            </SheetTrigger>
            <SheetContent side='top' className='p-0 rounded-b-[30px] overflow-hidden'>
                <Card className='w-full h-full border-0'>
                    <CardHeader>
                        <CardTitle className='text-base'>Add New Documents</CardTitle>
                        <CardDescription className='text-sm'>Fill the required document informations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor='document'>Upload Document</Label>
                                    <Input type='file' multiple className='cursor-pointer' onChange={handleFileChange}></Input>
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor='Document Name'>Document Name</Label>
                                    <Input disabled={selectedBulkFiles !== null} value={title} onChange={(e) => setTitle(e.target.value)} type='text' placeholder='Name of your document'></Input>
                                    {selectedBulkFiles && selectedBulkFiles.length > 1 && <p className="text-xs text-muted-foreground">Title is set to the original file name for bulk upload</p>}
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor='Document Topic'>Document Topic</Label>
                                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} type='text' placeholder='Topic of your document'></Input>
                                </div>
                            </div>
                            <p className="text-xs text-red-500 mt-2">{ error }</p>
                        </form>
                    </CardContent>
                    <CardFooter className='flex justify-between'>
                        <Button variant={"default"} size={"sm"} onClick={selectedBulkFiles ? handleBulkUpload : uploadDocument} className='w-full bg-blue-700'>Upload</Button>
                    </CardFooter>
                </Card>
            </SheetContent>
        </Sheet>
    )
  }

  return (
    <Popover onOpenChange={handleCancel} open={isOpen}>
        <PopoverTrigger asChild>
            <Button variant={"outline"} className='w-full sm:w-fit text-xs h-8 shadow gap-x-2'>
                <UploadIcon/>
                Upload
            </Button>
        </PopoverTrigger>
        <PopoverContent className='absolute p-0 w-fit h-fit border-none' align='start'>
            <Card className='w-[350px]'>
                <CardHeader>
                    <CardTitle className='text-base'>Add New Documents</CardTitle>
                    <CardDescription className='text-sm'>Fill the required document informations</CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor='document'>Upload Document</Label>
                                <Input type='file' multiple className='cursor-pointer' onChange={handleFileChange}></Input>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor='Document Name'>Document Name</Label>
                                <Input disabled={selectedBulkFiles !== null} value={title} onChange={(e) => setTitle(e.target.value)} type='text' placeholder='Name of your document'></Input>
                                {selectedBulkFiles && selectedBulkFiles.length > 1 && <p className="text-xs text-muted-foreground">Title is set to the original file name for bulk upload</p>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor='Document Topic'>Document Topic</Label>
                                <Input value={topic} onChange={(e) => setTopic(e.target.value)} type='text' placeholder='Topic of your document'></Input>
                            </div>
                        </div>
                        <p className="text-xs text-red-500 mt-2">{ error }</p>
                    </form>
                </CardContent>
                <CardFooter className='flex justify-between'>
                    <Button variant={"outline"} size={"sm"} onClick={handleCancel}>Cancel</Button>
                    <Button variant={"default"} size={"sm"} onClick={selectedBulkFiles ? handleBulkUpload : uploadDocument} className='w-full sm:w-fit bg-blue-700'>Upload</Button>
                </CardFooter>
            </Card>
        </PopoverContent>
    </Popover>
  )
}

export default UploadCard