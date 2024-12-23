"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "sonner";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegisterFormValues {
  email: string;
  userName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  laboratory: string | null;
  designation: string | null;
  password: string;
  rePassword: string;
  phoneNumber: string;
}

interface CreateAccountProps {
  closeDialog: () => void;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ closeDialog }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [rePasswordError, setRePasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const form = useForm<RegisterFormValues>();

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };
  const validatePhoneNumber = (value: string) => {
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(value)) {
      setPhoneError("Number must be exactly 11 digits and start with '09'");
    } else {
      setPhoneError("");
    }
  };

  const validatePassword = (value: string) => {
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/;
    if (!passwordRegex.test(value)) {
      setPasswordError(
        "Password must be 8-15 characters long and include letters, numbers, and special characters"
      );
    } else {
      setPasswordError("");
    }
  };

  const validateRePassword = (value: string) => {
    if (value !== form.getValues("password")) {
      setRePasswordError("Passwords do not match");
    } else {
      setRePasswordError("");
    }
  };

  const handleRegister: SubmitHandler<RegisterFormValues> = async (values) => {
    if (values.password !== values.rePassword) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}admin-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: values.userName,
            email: values.email,
            password: values.password,
            firstName: values.firstName,
            middleName: values.middleName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber,
            designation: values.designation || undefined,
            labId: values.laboratory ? parseInt(values.laboratory) : undefined,
          }),
        }
      );
      if (response.ok) {
        toast.success("Registration successful!");
        closeDialog();
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Registration failed!");
      }
    } catch (error) {
      toast.error("An error occurred during registration.");
    }
  };

  return (
    <div className="md:flex items-center justify-center">
      <Toaster />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRegister)}>
          <div className="grid md:grid-cols-3 grid-cols-1 gap-4 mb-5 text-sm">
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email Address <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl w-full p-3 border border-gray-300"
                      type="email"
                      placeholder="Email"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        validateEmail(e.target.value);
                      }}
                      required
                    />
                  </FormControl>
                  {emailError && <FormMessage>{emailError}</FormMessage>}
                </FormItem>
              )}
            />
            <FormField
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Username <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Username"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone Number <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Phone Number"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        validatePhoneNumber(e.target.value);
                      }}
                      required
                    />
                  </FormControl>
                  {phoneError && <FormMessage>{phoneError}</FormMessage>}{" "}
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            <FormField
              name="lastName"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>
                    Last Name <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Last Name"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="firstName"
              render={({ field }) => (
                <FormItem className="col-span-1 lg:col-span-2">
                  <FormLabel>
                    First Name <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="First Name"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="middleName"
              render={({ field }) => (
                <FormItem className="col-span-1 lg:col-span-1">
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Middle Name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <FormField
              name="laboratory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Laboratory <span className="text-red-400">*</span>
                  </FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="rounded-xl w-full flex justify-between items-center"
                      >
                        <span
                          className={cn(
                            field.value ? "text-black" : "text-gray-500"
                          )}
                        >
                          {field.value === 1
                            ? "Pathology"
                            : field.value === 2
                            ? "Immunology"
                            : field.value === 3
                            ? "Microbiology"
                            : "Select Laboratory"}
                        </span>
                        <span className="ml-auto">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Laboratories</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[
                        { label: "Pathology", value: 1 },
                        { label: "Immunology", value: 2 },
                        { label: "Microbiology", value: 3 },
                      ].map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option.value}
                          checked={field.value === option.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? option.value : null)
                          }
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Designation <span className="text-red-400">*</span>
                  </FormLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl flex justify-between items-center"
                      >
                        <span
                          className={cn(
                            field.value ? "text-black" : "text-gray-500"
                          )}
                        >
                          {field.value || "Select Designation"}
                        </span>
                        <span className="ml-auto">▼</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Designations</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {[
                        "Medical Technologist",
                        "Researcher",
                        "Lab Manager",
                        "Student",
                        "Technician",
                        "Admin",
                      ].map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option}
                          checked={field.value === option}
                          onCheckedChange={(checked) =>
                            field.onChange(checked ? option : null)
                          }
                        >
                          {option}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid-cols-1 grid md:grid-cols-2 gap-4 mb-5">
            <FormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Password <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="rounded-xl w-full p-3 pr-10 border border-gray-300"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          validatePassword(e.target.value);
                        }}
                        required
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  {passwordError && <FormMessage>{passwordError}</FormMessage>}
                </FormItem>
              )}
            />

            <FormField
              name="rePassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Re-enter Password <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="rounded-xl w-full p-3 pr-10 border border-gray-300"
                        type={showRePassword ? "text" : "password"}
                        placeholder="Re-enter Password"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          validateRePassword(e.target.value);
                        }}
                        required
                      />
                      <div
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400"
                        onClick={() => setShowRePassword(!showRePassword)}
                      >
                        {showRePassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </div>
                    </div>
                  </FormControl>
                  {rePasswordError && (
                    <FormMessage>{rePasswordError}</FormMessage>
                  )}
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end gap-2 pt-6">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={closeDialog}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-teal-500 text-white hover:bg-teal-700 transition-colors duration-300 ease-in-out"
            >
              Add User
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateAccount;
