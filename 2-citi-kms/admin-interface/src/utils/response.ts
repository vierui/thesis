import { NextResponse } from "next/server";

export class CustomResponse {

    constructor() {}

    sendSuccess(message:string, payload?: any, statusCode=200) {
        const data = {
            message,
            payload
        }
        return NextResponse.json(data, { status: statusCode})
    }

    sendError(message: string, statusCode=500) {
        const data = {
            message
        }
        return NextResponse.json(data, { status: statusCode})
    }
}