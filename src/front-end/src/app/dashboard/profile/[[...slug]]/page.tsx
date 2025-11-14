"use client";
import React, { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { getUserInfo, updateUser } from "@/lib/user-queries";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { z } from "zod";
import SessionDialog from "@/components/session_dialog";

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  img_url: string;
}

const formSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  img_url: z.string(),
});

const ProfilePage = () => {
  const { userId } = useAuth();
  const [user, setUser] = useState<User | null>();
  const [isLoading, setIsLoading] = useState(true);
  const [formReady, setFormReady] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      img_url: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserInfo(userId?.toString() || "");
        setUser(userData);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
        setFormReady(true);
      }
    };
    fetchData();
  }, [userId]);

  useEffect(() => {
    if (user && formReady) {
      form.setValue("username", user.username);
      form.setValue("email", user.email);
      form.setValue("first_name", user.first_name);
      form.setValue("last_name", user.last_name);
      form.setValue("img_url", user.img_url);
    }
  }, [user, formReady, form]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center space-x-4 justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-[1000px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
      </div>
    );
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      updateUser(
        userId?.toString() || "",
        values.email,
        values.username,
        values.first_name,
        values.last_name,
        values.img_url
      );
    } catch (err) {
      console.log(err);
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem while updating your profile.",
      });
    }
    toast({
      title: "Profile Updated!",
      description: "Your profile has been updated successfully",
    });
  };

  return (
    <div className="flex flex-col p-7">
      <SessionDialog />
      <div className="pb-7">
        <h1 className="text-3xl font-bold text-blue-700">Profile Setting</h1>
        <p>This is the profile page</p>
      </div>
      <div className="p-10 border-2 rounded-lg flex-1">
        <Image priority src={user?.img_url || ""} alt="" width={200} height={200} className="rounded-full h-auto w-auto overflow-hidden object-cover mx-auto" />
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-10"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <Input placeholder="Username" {...field} />
                  <FormMessage>
                    {formState.errors.username?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input placeholder="example@example.com" {...field} />
                  <FormMessage>{formState.errors.email?.message}</FormMessage>
                </FormItem>
              )}
            />
            <div className="justify-center flex">
              <div className="flex-1 pr-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field, formState }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <Input placeholder="John" {...field} />
                      <FormMessage>
                        {formState.errors.first_name?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex-1 pl-2">
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field, formState }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <Input placeholder="Duke" {...field} />
                      <FormMessage>
                        {formState.errors.last_name?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="img_url"
              render={({ field, formState }) => (
                <FormItem>
                  <FormLabel>Image Profile URL</FormLabel>
                  <Input placeholder="Duke" {...field} />
                  <FormMessage>{formState.errors.img_url?.message}</FormMessage>
                </FormItem>
              )}
            />
            <Button className="bg-blue-700">
              <span>Save</span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfilePage;
