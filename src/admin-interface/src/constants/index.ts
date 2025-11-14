import { FileTextIcon, PersonIcon, HomeIcon } from "@radix-ui/react-icons"


export const sidebarElements = [
    {
        name: "Main",
        path: "/main",
        icon: HomeIcon
    },
    {
        name: "Users Manager",
        path: "/user-manager",
        icon: PersonIcon
    },
    {
        name: "Documents Manager",
        path: "/document-manager",
        icon: FileTextIcon
    },
]


// Document Manager Constants
export const docTableAttr = [
    'No', 'Title', 'Topic', 'Tag', 'Owner', 'Size', 'Date Added'
]

export const tagStyles = {
    "txt": 'bg-indigo-200 text-indigo-900',
    "pdf": 'bg-red-200 text-red-900',
    "md": 'bg-blue-200 text-blue-900'
}


// User Manager Page Constants
export const userTableAttr = [
    'No', 'Username', 'Email', 'Join Date', 
    'Chats Count', 'Documents Count', 'Likes',
    'Dislikes', 'Storage'
]

// Pagination Constants
export const numberOfPages = [
    10, 30, 50
]
