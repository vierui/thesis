import { PrismaClient } from "@prisma/client";
import Client from "ssh2-sftp-client";
// this code instantiate prisma client that is used accross the app

declare global {
  var prisma: PrismaClient | undefined;
  var sftpClient: any;
}

export const prisma = globalThis.prisma || new PrismaClient();
export const sftpClient = globalThis.sftpClient || new Client();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
  globalThis.sftpClient = sftpClient;
}
