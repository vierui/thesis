import { toast } from "sonner";
import Loading from "@/components/Loading";

export const toastError = (errorMsg: string, title?:string, infinite?:boolean) => {
    const t = toast.error(title ? title : "Error",  {
        description: errorMsg,
        duration: infinite ? Infinity : 3000,
        className: "bg-red-700 text-white border-none",
        cancel: <button className="ml-auto rounded bg-white text-neutral-900 px-2 font-medium" onClick={() => toast.dismiss(t)}>Close</button>
    })
}

export const toastSuccess = (successMsg: string, title?:string, infinite?:boolean, onClose?:() => void, onCloseBtnMsg?:string) => {
    const t = toast.success(title ? title : "Success",  {
        description: successMsg,
        duration: infinite ? Infinity : 2000,
        className: "bg-blue-700 text-white border-none",
        cancel: onClose ? <button className="ml-auto rounded bg-white text-neutral-900 px-2 font-medium" onClick={() => {onClose(); toast.dismiss(t)}}>{onCloseBtnMsg ? onCloseBtnMsg : "Close"}</button> : <></>
    })
}

export const toastLoading = (title: string, loadingMsg: string) => {
    const t = toast(
        <div className="flex items-center gap-x-3 rounded-lg bg-white w-full">
            <Loading/>
            <div className="flex flex-col">
                <h1 className="font-semibold text-sm">{ title }</h1>
                <p className="text-sm">{ loadingMsg }</p>
            </div>
        </div>,
        {
            duration: Infinity
        }
    )
    const close = () => {
        toast.dismiss(t)
    }

    return close
}