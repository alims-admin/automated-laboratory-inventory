"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
import { Supplier } from "@/packages/api/lab";

interface CreateSupplierProps {
  closeDialog: () => void;
}

const AddSupplier: React.FC<CreateSupplierProps> = ({ closeDialog }) => {
  const form = useForm<Supplier>();
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

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
      setPhoneError(
        "Phone number must be exactly 11 digits and start with '09'"
      );
    } else {
      setPhoneError("");
    }
  };

  const handleRegister: SubmitHandler<Supplier> = async (values) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}supplier/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: values.companyName,
            contactPerson: values.contactPerson,
            email: values.email,
            address: values.address,
            phoneNumber: values.phoneNumber,
          }),
        }
      );
      if (response.ok) {
        toast.success("Add supplier successful!");
        closeDialog();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Adding supplier failed!");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="items-center justify-center w-full">
      <Toaster />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleRegister)}>
          <div className="text-sm w-full gap-4">
            <FormField
              name="companyName"
              render={({ field }) => (
                <FormItem className="mb-5 w-full">
                  <FormLabel>
                    Company Name <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl w-full border border-gray-300"
                      placeholder="Company Name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                      required
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="contactPerson"
              render={({ field }) => (
                <FormItem className="mb-5">
                  <FormLabel>
                    Contact Person <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Contact Person"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="email"
              render={({ field }) => (
                <FormItem className="mb-5">
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="mb-5">
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
                  {phoneError && <FormMessage>{phoneError}</FormMessage>}
                </FormItem>
              )}
            />

            <FormField
              name="address"
              render={({ field }) => (
                <FormItem className="mb-5">
                  <FormLabel>
                    Address <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl"
                      placeholder="Address"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={!!emailError || !!phoneError}
              >
                Add Supplier
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddSupplier;
