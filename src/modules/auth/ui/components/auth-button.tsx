"use client";
import { Button } from "@/components/ui/button";
import { SignedOut, SignedIn, SignInButton, UserButton } from "@clerk/nextjs";
import { ClapperboardIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const AuthButton = () => {
  return (
    // Button里规定了svg大小，想要更改，需要在button里改[&_svg]:size-4
    <>
      <SignedIn>
        <Button asChild variant="secondary">
          <Link href="/studio">
            <ClapperboardIcon className="size-4" />
            Studio
          </Link>
        </Button>
        {/* TODO:给原有按钮排序 */}
        <UserButton>
          <UserButton.MenuItems>
            {/* TODO:add user profile menu button*/}
            <UserButton.Link
              label="Studio"
              href="/studio"
              labelIcon={<ClapperboardIcon className="size-4" />}
            />
            <UserButton.Action label="manageAccount" />
          </UserButton.MenuItems>
        </UserButton>
        {/*TODO: Add menu items for studio and user profile */}
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button
            variant="outline"
            className="px-4 py-2 text-sm font-medium
    text-blue-600 hover:text-blue-500 border-blue-500/60 rounded-full shadow-none"
          >
            <UserCircleIcon />
            Sign in
          </Button>
        </SignInButton>
      </SignedOut>
    </>
  );
};

export default AuthButton;
