import React, { useEffect, useState } from "react";
import { getUserInfo } from "@/lib/user-queries";
import { useAuth } from "@clerk/nextjs";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import Link from "next/link";
import { UserProfileProps } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { FaUserEdit } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { IoIosLogOut } from "react-icons/io";
import { useRouter } from "next/navigation";

const UserProfile = () => {
  const { userId } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserProfileProps | null>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserInfo(userId || "").then((res) => {
      setUser(res);
      setIsLoading(false);
    });
  }, [userId]);

  if (isLoading)
    return (
      <div className="animate-pulse flex space-x-4 items-center">
        <div className="rounded-full bg-slate-400 h-10 w-10"></div>
        <div className="flex-1 space-y-6 py-1">
          <div className="h-10 bg-slate-400 rounded"></div>
        </div>
      </div>
    );
  else if (!user) {
    return <p className="text-sm text-red-700">User does not exist.</p>;
  }

  return (
    <Popover>
      <PopoverTrigger>
        <div className="h-fit w-full justify-start hover:bg-blue-600  flex items-center rounded-xl py-2 px-4 text-md animate-fade-in font-base">
          <Avatar className="mr-3">
            <AvatarImage src={user?.img_url} />
            <AvatarFallback>
              {user?.first_name[0] || "" + user?.last_name[0]}
            </AvatarFallback>
          </Avatar>
          {user?.username}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-1" align="center">
        <div className="w-48">
          <Button
            onClick={() => router.push("/dashboard/my-documents")}
            className="w-full justify-start text-blue-700 dark:text-blue-300"
            variant={"ghost"}
            size={"sm"}
          >
            <MdDashboard className="mr-3 text-blue-700 dark:text-blue-300" size={16} />
            Go to your dashboard
          </Button>
          <Button
            onClick={() => router.push("/dashboard/profile")}
            className="w-full justify-start text-blue-700 dark:text-blue-300"
            variant={"ghost"}
            size={"sm"}
          >
            <FaUserEdit className="mr-3 text-blue-700 dark:text-blue-300" size={16} />
            Profile Settings
          </Button>
          <Separator className="my-1" />
          <Button
            className="w-full text-red-500 justify-start"
            variant={"ghost"}
            size={"sm"}
            onClick={() => router.push("/log-out")}
          >
            <IoIosLogOut className="mr-3" size={16} />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfile;
