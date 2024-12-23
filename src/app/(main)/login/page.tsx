"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, RotateCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const url = `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }login?identifier=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.text();
        const userIdMatch = data.match(/userId:(\d+)/);
        const roleMatch = data.match(/role:(\w+)/);

        if (userIdMatch && roleMatch) {
          const userId = userIdMatch[1];
          const role = roleMatch[1];

          localStorage.setItem("authToken", userId);
          localStorage.setItem("userRole", role);

          if (role === "admin" || role === "superadmin") {
            router.push("/admin-dashboard");
          } else {
            router.push("/lab/pathology");
          }
          toast.success("Login successful!");
        }
      } else {
        const errorMessage = await response.text();
        toast.error(errorMessage || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };
  const handlePasswordReset = async () => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_URL
        }forgot-password?email=${encodeURIComponent(email)}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      toast.success("Password reset email sent successfully.");
      setShowResetDialog(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-gray-100">
      <Card className="lg:w-3/5 md:w-4/5 md:flex-row flex max-w-screen-2xl h-full w-full md:h-2/3 shadow-lg rounded-3xl">
        <div className="hidden w-1/2 p-8 bg-teal-100 h-full rounded-3xl rounded-r-none md:flex flex-col items-center justify-center overflow-hidden">
          <Image
            src="/images/logo.png"
            alt="Logo"
            className="transition duration-500 hover:scale-105 h-3/4 aspect-[1/1] object-contain justify-center w-full"
            priority
            height={300}
            width={300}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-base lg:text-lg px-5 lg:pt-2 text-center font-bold antialiased tracking-tight text-teal-900 transition duration-500 hover:scale-105 cursor-pointer break-words">
                  Automated Laboratory Inventory Management System
                </h1>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-base text-center antialiased tracking-tight text-teal-900 max-w-xs">
                  Project ALIMS is designed for PGH Medical Research Laboratory
                  of Pathology, Immunology, and Microbiology. Providing
                  assistance with report generation and inventory management.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="w-full md:w-1/2 flex flex-col h-full p-12 rounded-3xl rounded-l-none overflow-auto	">
          <div className="flex flex-col md:hidden items-center justify-center px-2 pt-8">
            <Image
              src="/images/logo.png"
              alt="Logo"
              className="transition duration-500 hover:scale-105"
              height={45}
              width={45}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h1
                    className="text-base pt-2 text-center font-bold antialiased tracking-tight text-teal-900 transition duration-500 hover:scale-105 cursor-pointer"
                    tabIndex={0}
                  >
                    Automated Laboratory Inventory Management System
                  </h1>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs md:text-[12px] text-center antialiased tracking-tight text-teal-900 max-w-xs">
                    Project ALIMS is designed for PGH Medical Research
                    Laboratory of Pathology, Immunology, and Microbiology.
                    Providing assistance with report generation and inventory
                    management.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h1 className="block text-base md:text-xl font-bold text-teal-700 text-center pb-8">
            Login
          </h1>
          <Toaster />

          <label className="pb-2 text-base text-gray-500">Email Address</label>
          <Input
            className="mb-4 rounded-xl"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="pb-2 text-base text-gray-500">Password</label>
          <div className="relative">
            <Input
              className="rounded-xl w-full p-3 pr-10 border border-gray-300"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>
          <a
            onClick={() => {
              setShowResetDialog(true);
            }}
            className="text-teal-500  hover:text-teal-700 transition-colors duration-300 ease-in-out text-right text-sm pb-6 mt-1"
          >
            Forgot password?
          </a>

          <Button
            className="bg-teal-500 text-white w-full rounded-xl hover:bg-teal-700 transition-colors duration-300 ease-in-out"
            onClick={handleLogin}
          >
            LOGIN
          </Button>
          <p className="text-center text-gray-400 text-sm mt-1">
            Not yet registered? Click
            <a
              onClick={() => router.push("/registration")}
              className="text-teal-500 hover:text-teal-700 transition-colors duration-300 ease-in-out"
            >
              <b> here </b>
            </a>
            to create an account.
          </p>
        </div>
      </Card>
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight text-teal-900 mt-2">
              <RotateCw className="text-teal-900 size-5 -mt-0.5" />
              Reset Password
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="pt-2">
            <label
              htmlFor="email"
              className="text-xs font-medium text-gray-500"
            >
              Email Address
            </label>
            <Input
              type="email"
              id="email"
              className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>
          <p className="text-left ml-1 -mt-2 relative text-sm mb-3">
            By clicking, a temporary password will be emailed to you.
          </p>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={() => setShowResetDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="ghost"
              className="bg-teal-500 text-white hover:bg-teal-700 hover:text-white transition-colors duration-300 ease-in-out"
              onClick={() => {
                handlePasswordReset();
              }}
            >
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginPage;
