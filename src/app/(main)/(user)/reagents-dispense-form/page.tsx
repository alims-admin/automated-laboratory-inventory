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
import { MaterialSchema } from "@/packages/api/inventory";
import { UserSchema } from "@/packages/api/user";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface ReagentDispenseFormValues {
  date: string;
  materialId: number;
  name: string;
  totalNoContainers: number;
  lotNo: string;
  qtyDispensed: number;
  remainingQuantity: number;
  remarks: string;
  userId: number;
}

const ReagentDispenseForm = () => {
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
      totalNoContainers?: number;
      lotNo?: string;
      qtyPerContainer?: number;
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
    const value = Math.min(Math.max(Number(e.target.value), 1), maxQuantity);
    setQuantity(value);
  };
  const form = useForm<ReagentDispenseFormValues>({
    defaultValues: {
      date: "",
      materialId: 0,
      name: "",
      totalNoContainers: 0,
      lotNo: "",
      qtyDispensed: 0,
      remainingQuantity: 0,
      remarks: "",
      userId: Number(currentUserId) ?? 0,
    },
    mode: "onChange",
  });

  const handleSubmit = async (values: ReagentDispenseFormValues) => {
    // Form validation
    if (!values.date) {
      toast.error("Date is required.");
      return;
    }
    if (!values.materialId) {
      toast.error("Material is required.");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity dispensed must be greater than 0.");
      return;
    }
    if (!values.remarks) {
      toast.error("Remarks are required.");
      return;
    }
    if (!values.userId) {
      toast.error("Analyst is required.");
      return;
    }
    const parsedValues = {
      ...values,
      qtyDispensed: quantity,
      name: selectedMaterialId
        ? materials.find(
            (material) => material.materialId === selectedMaterialId
          )?.itemName || ""
        : "",
      date: format(new Date(values.date), "yyyy-MM-dd"),
      department: selectedMaterialId
        ? materials.find(
            (material) => material.materialId === selectedMaterialId
          )?.laboratory || ""
        : "",
      analyst: selectedUserId
        ? users.find((user) => user.userId === selectedUserId)?.fullName || ""
        : "",
      reagentId: values.materialId,
      userId: values.userId,
      lotNo: selectedMaterialId
        ? materials.find(
            (material) => material.materialId === selectedMaterialId
          )?.lotNo || ""
        : "",
    };
    const reagentPayload = {
      date: parsedValues.date,
      reagentId: parsedValues.reagentId,
      name: parsedValues.name,
      lotNo: parsedValues.lotNo,
      qtyDispensed: parsedValues.qtyDispensed,
      remarks: parsedValues.remarks,
      userId: parsedValues.userId,
      analyst: parsedValues.analyst,
    };

    try {
      const dispenseResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}reagents-dispense`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reagentPayload),
        }
      );

      if (!dispenseResponse.ok) {
        throw new Error("Failed to file reagent dispense form");
      }

      toast.success("Reagent dispense form filed successfully!");
      router.push(`lab/${parsedValues.department.toLowerCase()}`);
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
        const mappedMaterials = data
          .filter((material) => material.category.shortName === "Reagent")
          .map((material) => ({
            materialId: material.materialId ?? 0,
            itemName: material.itemName,
            quantityAvailable: material.quantityAvailable ?? 0,
            laboratory: material.laboratory.labName,
            category: material.category.shortName,
            totalNoContainers: material.totalNoContainers,
            lotNo: material.lotNo,
            qtyPerContainer: material.qtyPerContainer,
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
          <h1 className="text-lg sm:text-xl font-bold py-1 text-center">
            Reagent Dispense Form
          </h1>
          <hr className="w-full border-t-1 border-gray-300 my-1" />
        </div>

        <Toaster />

        <div className="md:overflow-y-auto md:max-h-[400px] mb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <FormField
                  name="date"
                  rules={{ required: "Date is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
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
                  name="materialId"
                  rules={{ required: "Material is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
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
                                        value={material.itemName.toString()}
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
                  name="qtyDispensed"
                  rules={{ required: "Quantity is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Quantity"
                          {...field}
                          value={quantity.toString()}
                          required
                          className="w-full"
                          max={maxQuantity}
                          min={1}
                          onChange={handleInputChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="remainingQuantity"
                  render={({}) => (
                    <FormItem>
                      <FormLabel>Remaining Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Calculated automatically"
                          value={(maxQuantity - quantity >= 0
                            ? maxQuantity - quantity
                            : 0
                          ).toString()}
                          readOnly
                          className="text-teal-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <FormField
                  name="totalNoContainers"
                  render={({}) => (
                    <FormItem>
                      <FormLabel>Total No. of Containers</FormLabel>
                      <FormControl>
                        <Input
                          className="text-teal-700"
                          type="number"
                          placeholder="Total Containers"
                          value={Math.ceil(
                            quantity /
                              (selectedMaterialId
                                ? materials.find(
                                    (material) =>
                                      material.materialId === selectedMaterialId
                                  )?.qtyPerContainer || 1
                                : 1)
                          ).toString()}
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="lotNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot No.</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Lot Number"
                          {...field}
                          className="text-teal-700"
                          value={
                            selectedMaterialId
                              ? materials.find(
                                  (material) =>
                                    material.materialId === selectedMaterialId
                                )?.lotNo || "None"
                              : "None"
                          }
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <FormField
                  name="userId"
                  rules={{ required: "Analyst is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Analyst</FormLabel>
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
                                      key={user.userId}
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
                  name="remarks"
                  rules={{ required: "Remarks are required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Remarks" {...field} required />
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

export default ReagentDispenseForm;
