"use client";
import { Button } from "@/components/ui/button";
import { SignedOut, SignedIn, SignInButton, UserButton } from "@clerk/nextjs";
import { UserCircleIcon } from "lucide-react";
import React from "react";

const AuthButton = () => {
  return (
    // Button里规定了svg大小，想要更改，需要在button里改[&_svg]:size-4
    <>
      <SignedIn>
        <UserButton />
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
