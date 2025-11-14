import { create } from "zustand";
import { User, Doc } from "@/types";

interface usersState {
    users: User[],
    setUsers: (newUsers: User[]) => void
}

interface docsState {
    docs: Doc[],
    setDocs: (newDocs: Doc[]) => void
}

interface tagState {
    tags: string[],
    setTags: (newTags: string[]) => void
}

export const useUsersStore = create<usersState>((set) => ({
    users: [],
    setUsers: (newUsers) => set({ users: newUsers })
}))

export const useDocsStore = create<docsState>((set) => ({
    docs: [],
    setDocs: (newDocs) => set({ docs: newDocs })
}))

export const useTagsStore = create<tagState>((set) => ({
    tags: [],
    setTags: (newTags) => set({ tags: newTags })
}))