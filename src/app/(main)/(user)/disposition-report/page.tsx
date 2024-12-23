"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Toaster, toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { DatePickerWithPresets } from "@/components/ui/datepicker";
import { Textarea } from "@/components/ui/textarea";
import { MaterialSchema } from "@/packages/api/inventory";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { UserSchema } from "@/packages/api/user";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface DispositionReportValues {
  userId: number;
  materialId: number;
  itemDescription: string;
  qty: number;
  reasonForDisposal: string;
  disposalMethod: string;
  dateDisposed: string;
  disposedBy: string;
  comments: string;
}

const DispositionReportForm = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("authToken");
  const [users, setUsers] = useState<
    { userId: number; fullName: string; laboratory: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    currentUserId ? Number(currentUserId) : null
  );
  const [selectedMaterialId, setSelectedMaterialId] = React.useState<
    number | null
  >(null);
  const [materials, setMaterials] = useState<
    {
      materialId: number;
      itemName: string;
      quantityAvailable: number;
      laboratory: string;
    }[]
  >([]);
  const [quantity, setQuantity] = useState<number>(0);
  const getMaxQuantity = (): number => {
    if (!selectedMaterialId) return 0;
    const material = materials.find(
      (material) => material.materialId === selectedMaterialId
    );
    return material ? material.quantityAvailable : 0;
  };

  const maxQuantity = getMaxQuantity();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxQuantity);
    setQuantity(value);
  };
  const form = useForm<DispositionReportValues>({
    defaultValues: {
      userId: selectedUserId ?? Number(currentUserId),
      materialId: selectedMaterialId ?? 1,
      itemDescription: "",
      qty: quantity,
      reasonForDisposal: "",
      disposalMethod: "",
      dateDisposed: "",
      disposedBy: "",
      comments: "",
    },
  });

  const handleSubmit = async (values: DispositionReportValues) => {
    if (!values.dateDisposed) {
      toast.error("Disposition date is required.");
      return;
    }
    if (!selectedUserId) {
      toast.error("Disposed by is required.");
      return;
    }
    if (!selectedMaterialId) {
      toast.error("Item is required.");
      return;
    }
    if (quantity <= 0 || quantity > maxQuantity) {
      toast.error("Quantity must be between 1 and the maximum available.");
      return;
    }
    if (!values.itemDescription.trim()) {
      toast.error("Item description is required.");
      return;
    }
    if (!values.reasonForDisposal.trim()) {
      toast.error("Reason for disposal is required.");
      return;
    }
    if (!values.disposalMethod.trim()) {
      toast.error("Disposal method is required.");
      return;
    }

    const parsedValues = {
      ...values,
      qty: quantity,
      dateDisposed: format(new Date(values.dateDisposed), "yyyy-MM-dd"),
      disposedBy: selectedUserId
        ? users.find((user) => user.userId === selectedUserId)?.fullName || ""
        : "",
    };
    const laboratory = selectedMaterialId
      ? materials
          .find((material) => material.materialId === selectedMaterialId)
          ?.laboratory.toLowerCase() || ""
      : "";
    try {
      const dispositionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}disposal/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(parsedValues),
        }
      );

      if (!dispositionResponse.ok) {
        throw new Error("Failed to file disposition report!");
      }

      toast.success("Disposition report filed successfully!");
      router.push(`lab/${laboratory}`);
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    }
  };
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}material/all`
        );
        if (!response.ok) throw new Error("Failed to fetch materials");

        const data: MaterialSchema[] = await response.json();
        const mappedMaterials = data.map((material) => ({
          materialId: material.materialId ?? 0,
          itemName: material.itemName,
          quantityAvailable: material.quantityAvailable ?? 0,
          laboratory: material.laboratory.labName,
        }));

        setMaterials(mappedMaterials);
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    fetchMaterials();
  }, []);
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}all-users`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data: UserSchema[] = await response.json();
        const filteredData = (() => {
          if (userRole === "admin") {
            return data.filter(
              (user) =>
                user.designation !== "admin" &&
                user.designation !== "superadmin" &&
                user.status.toLowerCase() === "active"
            );
          } else if (userRole === "superadmin") {
            return data.filter(
              (user) => user.status.toLowerCase() === "active"
            );
          } else {
            return data.filter(
              (user) => user.userId.toString() === currentUserId
            );
          }
        })();

        const mappedUsers = filteredData.map((user) => ({
          userId: user.userId,
          fullName: `${user.firstName} ${
            user.middleName ? user.middleName + " " : ""
          }${user.lastName}`,
          laboratory: user.laboratory.labName,
        }));

        setUsers(mappedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, [currentUserId, userRole]);
  return (
    <div className="flex justify-center bg-gray-100">
      <Card className="md:my-3 pt-8 px-8 pb-4 lg:w-3/5 md:w-4/5 w-full h-full md:h-[610px] md:shadow-lg md:rounded-lg rounded-none">
        <div className="flex flex-col items-center mb-4">
          <div className="flex space-x-4 mb-4">
            <div className="size-16 md:w-24 md:h-24 relative">
              <Image
                src="/images/mrl-logo.png"
                alt="Logo 1"
                fill
                style={{ objectFit: "contain" }}
                priority
                sizes="(max-width: 768px) 100vw, 24px"
              />
            </div>
            <div className="size-16 md:w-24 md:h-24 relative">
              <Image
                src="/images/pgh-logo.png"
                alt="Logo 2"
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 768px) 100vw, 24px"
              />
            </div>
          </div>
          <h1 className="text-xl font-bold py-1">Disposition Report Form</h1>
          <hr className="w-full border-t-1 border-gray-300 my-1" />
        </div>

        <Toaster />

        <div className="md:overflow-y-auto md:max-h-[400px] mb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <FormField
                  name="dateDisposed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disposition Date</FormLabel>
                      <FormControl>
                        <DatePickerWithPresets
                          date={field.value}
                          setDate={(newDate) => field.onChange(newDate)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disposed By</FormLabel>
                      <FormControl>
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger
                            asChild
                            className={cn(
                              selectedUserId === null
                                ? "text-gray-500"
                                : "text-black"
                            )}
                          >
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {selectedUserId
                                ? users.find(
                                    (user) => user.userId === selectedUserId
                                  )?.fullName
                                : "Select personnel..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="Search personnel..." />
                              <CommandList>
                                <CommandEmpty>No personnel found.</CommandEmpty>
                                <CommandGroup>
                                  {users.map((user) => (
                                    <CommandItem
                                      key={user.fullName}
                                      value={user.fullName.toString()}
                                      onSelect={() => {
                                        setSelectedUserId(
                                          selectedUserId === user.userId
                                            ? null
                                            : user.userId
                                        );
                                        field.onChange(user.userId);
                                        setOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={
                                          selectedUserId === user.userId
                                            ? "mr-2 h-4 w-4 opacity-100"
                                            : "mr-2 h-4 w-4 opacity-0"
                                        }
                                      />
                                      {user.fullName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="materialId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item</FormLabel>
                      <FormControl>
                        <Popover
                          open={openMaterial}
                          onOpenChange={setOpenMaterial}
                        >
                          <PopoverTrigger
                            asChild
                            className={cn(
                              selectedMaterialId === null
                                ? "text-gray-500"
                                : "text-black"
                            )}
                          >
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {selectedMaterialId
                                ? materials.find(
                                    (material) =>
                                      material.materialId === selectedMaterialId
                                  )?.itemName
                                : "Select equipment..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="flex p-0">
                            <Command>
                              <CommandInput placeholder="Search equipment..." />
                              <CommandList>
                                <CommandEmpty>No item found.</CommandEmpty>
                                <CommandGroup>
                                  <div className="max-h-36 overflow-y-auto">
                                    {materials.map((material) => (
                                      <CommandItem
                                        key={material.materialId}
                                        value={material.itemName}
                                        onSelect={() => {
                                          setSelectedMaterialId(
                                            selectedMaterialId ===
                                              material.materialId
                                              ? null
                                              : material.materialId
                                          );
                                          field.onChange(material.materialId);
                                        }}
                                      >
                                        <Check
                                          className={
                                            selectedMaterialId ===
                                            material.materialId
                                              ? "mr-2 h-4 w-4 opacity-100"
                                              : "mr-2 h-4 w-4 opacity-0"
                                          }
                                        />
                                        {material.itemName}
                                      </CommandItem>
                                    ))}
                                  </div>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Quantity"
                          {...field}
                          value={quantity}
                          required
                          className="w-full"
                          max={maxQuantity}
                          min={0}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="itemDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Item Description"
                          {...field}
                          required
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="reasonForDisposal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Disposal</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Why it was disposed..."
                          {...field}
                          required
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="disposalMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disposal Method</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="How it was disposed?"
                          {...field}
                          required
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any relevant information..."
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-center mt-8">
                <Button
                  type="submit"
                  onClick={form.handleSubmit(handleSubmit)}
                  className="bg-teal-500 text-white w-full hover:bg-teal-700 transition-colors duration-300 ease-in-out"
                >
                  Submit Form
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default DispositionReportForm;
