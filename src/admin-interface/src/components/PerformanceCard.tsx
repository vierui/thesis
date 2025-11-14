import React from 'react'
import { IconProps } from '@radix-ui/react-icons/dist/types'
import { IconType } from 'react-icons/lib'
import { title } from 'process'
import RenameAble from './RenameAble'

interface Props {
    icon: React.ReactNode
    title: string,
    value: string,
    unit?: string,
    setter?: (val:string) => void
}

const PerformanceCard = ({ icon: Icon, title, value, unit, setter }: Props) => {
  return (
    <div className="flex items-center h-full gap-3 px-5 w-64">
        {Icon}
        <div className="flex flex-col">
            <h3 className="font-light text-sm">{ title }</h3>
            <div className="flex items-end gap-1">
                {setter ? <RenameAble textDisplay={value}
                displayClassName='font-semibold text-blue-900 text-base'
                changingClassName='w-16'
                onChange={async(val:string) => setter(val)}/> : <h1 className="font-semibold text-blue-900">{ value }</h1>}
                {unit && <p>{ unit }</p>}
            </div>
        </div>
    </div>
  )
}

export default PerformanceCard