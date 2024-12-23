import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface AccountDetails {
  email: string;
  userName: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  phoneNumber: string;
  laboratory?: string;
  labId?: number;
  designation?: string;
  status?: string;
}

interface EditProps {
  closeDialog: () => void;
  editor?: string;
  userId?: string;
}

const EditAccount: React.FC<EditProps> = ({ closeDialog, editor, userId }) => {
  const currentUserId = userId ?? localStorage.getItem("authToken");
  const form = useForm<AccountDetails>({
    defaultValues: {
      email: "",
      userName: "",
      lastName: "",
      firstName: "",
      middleName: "",
      phoneNumber: "",
    },
  });
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
      setPhoneError("Number must be exactly 11 digits and start with '09'");
    } else {
      setPhoneError("");
    }
  };
  const handleAccountEdit: SubmitHandler<AccountDetails> = async (values) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}update-user/${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: values.userName,
            email: values.email,
            firstName: values.firstName,
            middleName: values.middleName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber,
            status: values.status,
            labId: values.labId,
            designation: values.designation,
          }),
        }
      );
      if (response.ok) {
        toast.success("Account update successful!");
        closeDialog();
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Account update failed!");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  useEffect(() => {
    const fetchInitialValues = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}user/${currentUserId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }

        const userData = await response.json();

        form.reset({
          email: userData.email,
          userName: userData.username,
          lastName: userData.lastName,
          firstName: userData.firstName,
          middleName: userData.middleName || "",
          phoneNumber: userData.phoneNumber,
          status:
            userData.status.charAt(0).toUpperCase() + userData.status.slice(1),
          labId: userData.labId,
          designation: userData.designation,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchInitialValues();
  }, [currentUserId, form]);
  return (
    <div className="items-center justify-center">
      <Toaster />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAccountEdit)}>
          <div className="grid sm:grid-cols-3 grid-cols-1 gap-3 mb-4">
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

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
            <FormField
              name="lastName"
              render={({ field }) => (
                <FormItem className="col-span-3 sm:col-span-2">
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
                <FormItem className="col-span-3 sm:col-span-2">
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
                <FormItem className="col-span-3 sm:col-span-1">
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
          {editor && editor == "admin" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <FormField
                  name="labId"
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
              <div className="grid grid-cols-1 mb-4">
                <FormField
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-red-400">*</span>
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
                              {field.value || "Select Status"}
                            </span>
                            <span className="ml-auto">▼</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {[
                            "Active",
                            "Unapproved Account",
                            "Unverified Email",
                            "Inactive",
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
            </>
          )}
          <div className="flex justify-end gap-2 pt-6">
            <Button
              type="button"
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
              Confirm Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
export default EditAccount;
