"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

type EditBorrowProps = {
  closeDialog: () => void;
  dispenseId: number;
} & ReagentDispenseFormValues;

const EditReagentDispense = ({
  dispenseId,
  date,
  materialId,
  name,
  totalNoContainers,
  lotNo,
  qtyDispensed,
  remainingQuantity,
  remarks,
  userId,
  closeDialog,
}: EditBorrowProps) => {
  const [open, setOpen] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const [users, setUsers] = useState<
    { userId: number; fullName: string; laboratory: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    userId
  );
  const [selectedMaterialId, setSelectedMaterialId] = React.useState<
    number | null
  >(materialId);
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
  const [quantity, setQuantity] = useState<number>(qtyDispensed);
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
  const form = useForm<ReagentDispenseFormValues>({
    defaultValues: {
      date: date,
      materialId: materialId,
      name: name,
      totalNoContainers: totalNoContainers,
      lotNo: lotNo,
      qtyDispensed: qtyDispensed,
      remainingQuantity: remainingQuantity,
      remarks: remarks,
      userId: userId,
    },
  });

  const handleSubmit = async (values: ReagentDispenseFormValues) => {
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
        `${process.env.NEXT_PUBLIC_BACKEND_URL}reagents-dispense/${dispenseId}`,
        {
          method: "PUT",
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
      closeDialog();
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
            return data.filter((user) => user.userId === userId);
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
  }, [userId, userRole]);

  return (
    <div className="justify-center">
      <Toaster />

      <div className="md:overflow-y-auto md:max-h-[430px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <FormField
                name="date"
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
                name="qtyDispensed"
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
                name="remainingQuantity"
                render={({}) => (
                  <FormItem>
                    <FormLabel>Remaining Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Calculated automatically"
                        value={maxQuantity - quantity}
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
                                )?.qtyPerContainer || 0
                              : 0)
                        )}
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
                              )?.lotNo || 0
                            : 0
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
                name="remarks"
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
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditReagentDispense;
