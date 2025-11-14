import { ReadStream } from "ssh2"
import { ReadonlyURLSearchParams } from "next/navigation"


export const getSearchParams = (paramValue: string | undefined | null, paramName: string, searchParams:ReadonlyURLSearchParams | URLSearchParams) => {
    const params = (searchParams instanceof ReadonlyURLSearchParams) ? new URLSearchParams(searchParams) : searchParams

    if (paramValue) params.set(paramName, paramValue)
    else params.delete(paramName)

    return params
}

async function* nodeStreamToIterator(stream: ReadStream) {
    for await (const chunk of stream) {
        yield chunk;
    }
}

function iteratorToStream(iterator:any): ReadableStream {
    return new ReadableStream({
        async pull(controller) {
            const { value, done } = await iterator.next()

            if (done) {
                controller.close()
            } else {
                controller.enqueue(new Uint8Array(value))
            }
        },
    })
}

export const streamFile = (stream:ReadStream) => {
    const data:ReadableStream = iteratorToStream(nodeStreamToIterator(stream))
    return data
}