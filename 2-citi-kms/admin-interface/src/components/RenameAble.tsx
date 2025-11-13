import React, { ReactNode, useState } from 'react'
import Loading from './Loading'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface Props {
    textDisplay: string
    onChange: (value: string) => Promise<string | void>
    displayClassName?: string,
    changingClassName?: string
}

const RenameAble = ({ textDisplay, displayClassName, changingClassName, onChange }: Props) => {
    const [displayText, setDisplayText] = useState<string>(textDisplay || "")
    const [isClicked, setIsClicked] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        await onChange(displayText)
        setIsLoading(false)
        setIsClicked(false)
    }

    const handleCancel = () => {
        setIsClicked(false)
        setDisplayText(textDisplay || "")
    }

    return (
        isLoading ? 
        <Loading size={16}/> : 
        !isClicked ? 
        <Button onClick={() => setIsClicked(true)} size={"sm"} variant={"ghost"} className={`text-sm p-1 font-normal h-fit whitespace-normal text-left ${displayClassName}`}>{ textDisplay }</Button> :
        <form onSubmit={handleSubmit}>
            <Input value={displayText} onBlur={handleCancel} autoFocus className={`h-fit w-fit  px-2 py-1 ${changingClassName}`} onChange={(e) => setDisplayText(e.target.value)}/> 
        </form>
    )
}

export default RenameAble