"use client"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { CalendarIcon } from "@radix-ui/react-icons"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const DatePicker = ({ date, onSelect, size="lg"}: { date: Date | undefined, onSelect: (newDate:Date) => void | React.Dispatch<React.SetStateAction<Date | undefined>>, size?:string}) => {

    return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            `${size === "sm" ? "w-fit" : "w-[90%]"} max-w-[240px] justify-start text-left font-normal gap-3`,
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {date ? <span className={`${size === "sm" ? "hidden" :"block text-xs" }`}>{ format(date, "PPP") }</span> : <span className={`${size === "sm" ? "hidden" :"block text-xs" }`}>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date ? date : new Date()}
          onSelect={(newDate) => onSelect(newDate)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
    )
}

export default DatePicker