import React, { useState, useMemo } from 'react'
import { IoSearchOutline } from "react-icons/io5"
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'


type Props =  {
    placeholder?: string,
    options: string[],
    selectedOptions?: string[],
    type: "select" | "checkbox",
    onClickItems: (option: string) => void,
    clearTags: () => void,
    applyTags: () => void
}

// const CommandOption = ({ placeholder, options, onClickItems, clearTags, applyTags, selectedOptions, type } : Props) => {
//     const [searchTerm, setSearchTerm] = useState<string>("")
//     const [compOptions, setCompOptions] = useState(options)

//     const filterOptions = (newSearchTerm:string) => {
//         setSearchTerm(newSearchTerm)
//         const newOps = options.filter(option => (option.startsWith(newSearchTerm) || !newSearchTerm))
//         setCompOptions(newOps);
//     }
    

//   return (
//     <div className='flex flex-col bg-white'>
//         {placeholder && <div className="flex items-center py-2 px-3 text-sm border-b">
//             <IoSearchOutline size={16} className='mr-2'/>
//             <input type="text" value={searchTerm} onChange={(e) => filterOptions(e.target.value)} placeholder={placeholder} className='outline-none w-full'/>
//         </div>}
//         { compOptions.length !== 0 ?
//         (<div className="flex flex-col p-1">
//             {compOptions.map((option) => (
//                 <Button asChild onClick={()=>onClickItems(option)} key={option} variant={"ghost"} size={"sm"} className='justify-start items-center'>
//                     <div className='flex items-center'>
//                         {type === "checkbox" && <Checkbox className='mr-2' checked={selectedOptions?.indexOf(option) !== -1}/>}
//                         <span>{ option }</span>
//                         <span>{selectedOptions?.indexOf(option) !== -1}</span>
//                     </div>
//                 </Button>
//             ))}
//         </div>) : <p className="text-xs text-muted-foreground py-2 px-3">No results found</p> }
//         <div className="flex items-center justify-between p-2">
//             <Badge variant={"outline"} className='px-3 hover:bg-slate-100 cursor-pointer' onClick={clearTags}>Reset</Badge>
//             <Badge className='bg-blue-700 px-3 hover:bg-slate-700 cursor-pointer' onClick={applyTags}>Apply</Badge>
//         </div>
//     </div>
//   )
// }
const CommandOption = ({ placeholder, options, onClickItems, clearTags, applyTags, selectedOptions, type } : Props) => {
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Compute filtered options based on searchTerm - no need for separate state
    const compOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const filterOptions = (newSearchTerm: string) => {
        setSearchTerm(newSearchTerm);
    }
    

  return (
    // Wadah utama CommandOption: Gunakan warna 'card' untuk background, 'card-foreground' untuk teks
    // dan 'border' untuk border agar responsif dark mode
    <div className='flex flex-col bg-card text-card-foreground border border-border rounded-md'>
        {placeholder && (
            <div className="flex items-center py-2 px-3 text-sm border-b border-border">
                <IoSearchOutline size={16} className='mr-2 text-muted-foreground'/> {/* Icon search bisa pakai muted-foreground */}
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => filterOptions(e.target.value)}
                    placeholder={placeholder}
                    className='outline-none w-full bg-transparent text-foreground placeholder:text-muted-foreground' // Latar belakang transparan, teks mengikuti foreground, placeholder pakai muted
                />
            </div>
        )}
        { compOptions.length !== 0 ?
        (<div className="flex flex-col p-1">
            {compOptions.map((option) => (
                // Button ghost seharusnya sudah responsif jika Anda setup dengan benar di button.tsx
                // Tambahkan kelas untuk teks terpilih jika perlu
                <Button 
                    asChild 
                    onClick={()=>onClickItems(option)} 
                    key={option} 
                    variant={"ghost"} 
                    size={"sm"} 
                    className='justify-start items-center text-foreground' // Pastikan teks default item juga pakai foreground
                >
                    <div className='flex items-center'>
                        {/* Checkbox juga harus responsif jika komponennya sudah di-setup */}
                        {type === "checkbox" && <Checkbox className='mr-2' checked={selectedOptions?.includes(option) || false}/>}
                        <span>{ option }</span>
                        {/* Menghapus span ini karena sepertinya hanya untuk debugging: <span>{selectedOptions?.indexOf(option) !== -1}</span> */}
                    </div>
                </Button>
            ))}
        </div>) : (
            <p className="text-xs text-muted-foreground py-2 px-3">No results found</p>
        )}
        <div className="flex items-center justify-between p-2 border-t border-border">
            {/* Badge Outline */}
            <Badge 
                variant={"outline"} 
                className='px-3 cursor-pointer text-foreground border-border hover:bg-accent hover:text-accent-foreground' // Tambahkan text-foreground dan border-border agar responsif
                onClick={clearTags}
            >
                Reset
            </Badge>
            {/* Badge Default (atau sesuai kebutuhan) */}
            <Badge 
                className='bg-primary text-primary-foreground px-3 cursor-pointer hover:bg-primary/90' // Gunakan primary untuk Apply
                onClick={applyTags}
            >
                Apply
            </Badge>
        </div>
    </div>
  )
}

export default CommandOption