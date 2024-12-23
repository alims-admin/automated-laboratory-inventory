"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { UserSchema } from "@/packages/api/user";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronsUpDown,
  PlusCircle,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AddSupplier from "@/components/dialogs/supplier";
import { Category, Supplier } from "@/packages/api/lab";
import AddCategory from "@/components/dialogs/category";
import { format } from "date-fns";
import { EditInput } from "../ui/edit-input";
import { Textarea } from "../ui/textarea";

type FormValues = {
  date: string;
  labId?: number;
  category?: number;
  personnel: number;
  itemName: string;
  itemCode: string;
  quantity: string;
  unit: string;
  location: string;
  expiryDate: string;
  supplier: number;
  cost: string;
  totalNoContainers?: string;
  qtyPerContainer?: string;
  lotNo?: string;
  notes?: string;
  reorderThreshold: string;
  maxThreshold: string;
};

type EditProps = {
  closeDialog: () => void;
  materialId: number;
  shortName: string;
} & FormValues;

const EditInventory = ({
  labId,
  category,
  shortName,
  personnel,
  itemName,
  itemCode,
  unit,
  quantity,
  location,
  expiryDate,
  supplier,
  cost,
  closeDialog,
  materialId,
  lotNo,
  totalNoContainers,
  notes,
  reorderThreshold,
  maxThreshold,
  qtyPerContainer,
}: EditProps) => {
  const userRole = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("authToken");
  const [open, setOpen] = React.useState(false);
  const [openSupplier, setOpenSupplier] = React.useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [openCategory, setOpenCategory] = React.useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [users, setUsers] = useState<{ userId: number; fullName: string }[]>(
    []
  );
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    personnel || null
  );
  const [suppliers, setSuppliers] = useState<
    { supplierId: number; companyName: string }[]
  >([]);
  const [selectedSupplierId, setSelectedSupplierId] =
    React.useState<number>(supplier);
  const [categories, setCategories] = useState<
    { categoryId: number; shortName: string; subcategory1: string }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    number | null
  >(category || null);

  const [selectedLabId, setSelectedLabId] = React.useState<number | null>(
    labId || null
  );

  const form = useForm<FormValues>({
    defaultValues: {
      labId: labId,
      personnel: 0,
      itemName: itemName,
      itemCode: itemCode,
      unit: unit,
      location: location,
      expiryDate: expiryDate,
      category: category,
      supplier: selectedSupplierId,
      cost: cost,
      quantity: quantity,
      totalNoContainers: totalNoContainers,
      lotNo: lotNo,
      notes: notes,
      reorderThreshold: reorderThreshold,
      maxThreshold: maxThreshold,
      qtyPerContainer: qtyPerContainer,
    },
  });

  const addFilteredSupplier = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user first.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}filtered-suppliers/${selectedUserId}`
      );

      let filteredSuppliers: number[] = [];

      if (response.ok) {
        const data = await response.text();
        filteredSuppliers = data
          ? data
              .split(",")
              .filter((id: string) => id.trim() !== "")
              .map((id: string) => parseInt(id, 10))
          : [];
      }

      if (selectedSupplierId) {
        if (!filteredSuppliers.includes(selectedSupplierId)) {
          filteredSuppliers.push(selectedSupplierId);

          const updateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}update-user/${selectedUserId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                filteredSuppliers: filteredSuppliers.join(","),
              }),
            }
          );

          if (updateResponse.ok) {
            toast.success("Supplier successfully hidden!");
          } else {
            const errorData = await updateResponse.json();
            toast.error(errorData.message || "Archiving supplier failed!");
          }
        } else {
          toast.info("Supplier is already in the filtered list.");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const clearFilter = useCallback(async () => {
    try {
      const userId = selectedUserId ?? currentUserId;
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}update-user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filteredSuppliers: "",
          }),
        }
      );

      if (updateResponse.ok) {
        toast.success("Hidden supplier successfully unarchived!");
      } else {
        const errorData = await updateResponse.json();
        toast.error(errorData.message || "Unarchiving supplier failed!");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  }, [selectedUserId, currentUserId]);

  const handleSubmit = async (values: FormValues) => {
    const parsedValues = {
      ...values,
      quantity: Number(values.quantity),
      cost: Number(values.cost),
      date: values.date ? format(new Date(values.date), "yyyy-MM-dd") : "",
      expiryDate: format(new Date(values.expiryDate), "yyyy-MM-dd'T'HH:mm:ss"),
    };
    const materialPayload = {
      supplierId: parsedValues.supplier,
      categoryId: parsedValues.category,
      labId: parsedValues.labId,
      itemCode: parsedValues.itemCode,
      itemName: parsedValues.itemName,
      unit: parsedValues.unit,
      location: parsedValues.location,
      expiryDate: parsedValues.expiryDate,
      cost: parsedValues.cost,
      totalNoContainers: parsedValues.totalNoContainers,
      lotNo: parsedValues.lotNo,
      notes: parsedValues.notes,
      quantityAvailable: parsedValues.quantity,
      reorderThreshold: parsedValues.reorderThreshold,
      maxThreshold: parsedValues.maxThreshold,
      qtyPerContainer: parsedValues.qtyPerContainer,
    };

    const inventoryLogPayload = {
      userId: parsedValues.personnel,
      materialId: materialId,
      date: parsedValues.date,
      quantity: 0,
      source: `Edited by user no. ${parsedValues.personnel}`,
      remarks: "Edit details",
    };

    try {
      const materialResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}material/update/${materialId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(materialPayload),
        }
      );
      if (!materialResponse.ok) {
        throw new Error("Failed to edit material");
      }

      const inventoryLogResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}inventory-log`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inventoryLogPayload),
        }
      );

      if (!inventoryLogResponse.ok) {
        throw new Error("Failed to create inventory log");
      }

      toast.success("Material and inventory log updated successfully!");
      form.reset();
      closeDialog();
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    }
  };
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
        }));

        setUsers(mappedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, [currentUserId, userRole]);

  useEffect(() => {
    if (!openSupplier) {
      const fetchSuppliers = async () => {
        try {
          const userId = selectedUserId ?? currentUserId;

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}supplier/unfiltered/${userId}`
          );
          if (!response.ok) throw new Error("Failed to fetch suppliers");

          const data: Supplier[] = await response.json();
          const mappedSuppliers = data.map((supplier) => ({
            supplierId: supplier.supplierId ?? 0,
            companyName: supplier.companyName,
          }));

          setSuppliers(mappedSuppliers);
        } catch (error) {
          console.error("Error fetching suppliers:", error);
        }
      };

      fetchSuppliers();
    }
  }, [openSupplier, selectedUserId, currentUserId, clearFilter]);

  useEffect(() => {
    if (!openCategory) {
      const fetchCategories = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}category/categories`
          );
          if (!response.ok) throw new Error("Failed to fetch categories");

          const data: Category[] = await response.json();
          const mappedCategories = data
            .filter((category) => category.shortName?.includes(shortName))
            .map((category) => ({
              categoryId: category.categoryId ?? 0,
              shortName: category.shortName,
              subcategory1: category.subcategory1,
            }));

          setCategories(mappedCategories);
        } catch (error) {
          console.error("Error fetching categories:", error);
        }
      };

      fetchCategories();
    }
  }, [openCategory, shortName]);

  return (
    <div className="flex flex-col justify-center">
      <Toaster />

      <div className="overflow-y-auto max-h-[400px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edit Date</FormLabel>
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
                name="personnel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="personnel">Editor</FormLabel>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="labId"
                render={({}) => (
                  <FormItem>
                    <FormLabel>Laboratory</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full flex justify-between items-center"
                        >
                          <span
                            className={cn(
                              selectedLabId ? "text-black" : "text-gray-500"
                            )}
                          >
                            {selectedLabId === 1
                              ? "Pathology"
                              : selectedLabId === 2
                              ? "Immunology"
                              : selectedLabId === 3
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
                            checked={selectedLabId === option.value}
                            onCheckedChange={(checked) =>
                              setSelectedLabId(checked ? option.value : null)
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Popover
                        open={openCategory}
                        onOpenChange={setOpenCategory}
                      >
                        <PopoverTrigger
                          asChild
                          className={cn(
                            selectedCategoryId === null
                              ? "text-gray-500"
                              : "text-black"
                          )}
                        >
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedCategoryId
                              ? categories.find(
                                  (category) =>
                                    category.categoryId === selectedCategoryId
                                )?.subcategory1
                              : "Select category..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex p-0">
                          <Command>
                            <CommandInput placeholder="Search category..." />
                            <CommandList>
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandGroup>
                                {categories.map((category) => (
                                  <CommandItem
                                    key={category.subcategory1}
                                    value={category.subcategory1}
                                    onSelect={() => {
                                      setSelectedCategoryId(
                                        selectedCategoryId ===
                                          category.categoryId
                                          ? null
                                          : category.categoryId
                                      );
                                      field.onChange(category.categoryId);
                                      setOpenCategory(false);
                                    }}
                                  >
                                    <Check
                                      className={
                                        selectedCategoryId ===
                                        category.categoryId
                                          ? "mr-2 h-4 w-4 opacity-100"
                                          : "mr-2 h-4 w-4 opacity-0"
                                      }
                                    />
                                    {category.subcategory1}
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  value="AddCategory"
                                  onSelect={() => {
                                    setOpenCategory(false);
                                  }}
                                  className="px-0 pb-1"
                                >
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-lg bg-teal-600 hover:bg-teal-900 text-white w-full text-left justify-start"
                                    onClick={() => {
                                      setCategoryDialogOpen(true);
                                    }}
                                  >
                                    <PlusCircle className="" />
                                    Add Category
                                  </Button>
                                </CommandItem>
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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <EditInput
                        placeholder={itemName}
                        {...field}
                        className="w-full placeholder-black"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Code</FormLabel>
                    <FormControl>
                      <EditInput
                        placeholder={itemCode}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={quantity}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <EditInput
                        placeholder={unit}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="reorderThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={reorderThreshold}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="maxThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Threshold</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={maxThreshold}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {shortName === "Reagent" && (
              <div className="grid grid-cols-1 md:grid-cols-3 mb-4 gap-4">
                <FormField
                  name="totalNoContainers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Containers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={totalNoContainers}
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="qtyPerContainer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount per Container</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={qtyPerContainer}
                          {...field}
                          className="w-full"
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
                      <FormLabel>Lot Number</FormLabel>
                      <FormControl>
                        <EditInput
                          placeholder={lotNo}
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <EditInput
                        placeholder={location}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="expiryDate"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="expiryDate">Expiry Date</FormLabel>
                    <FormControl>
                      <DatePickerWithPresets
                        date={new Date(field.value)}
                        setDate={(newDate) => field.onChange(newDate)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Popover
                        open={openSupplier}
                        onOpenChange={setOpenSupplier}
                      >
                        <PopoverTrigger
                          asChild
                          className={cn(
                            selectedSupplierId === null
                              ? "text-gray-500"
                              : "text-black"
                          )}
                        >
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedSupplierId
                              ? suppliers.find(
                                  (supplier) =>
                                    supplier.supplierId === selectedSupplierId
                                )?.companyName
                              : "Select supplier..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex p-0">
                          <Command>
                            <CommandInput placeholder="Search supplier..." />
                            <CommandList>
                              <CommandEmpty>No supplier found.</CommandEmpty>
                              <CommandGroup>
                                <div className="max-h-36 overflow-y-auto">
                                  {suppliers.map((supplier) => (
                                    <CommandItem
                                      className="group"
                                      key={supplier.companyName}
                                      value={supplier.companyName}
                                      onSelect={() => {
                                        setSelectedSupplierId(
                                          selectedSupplierId ===
                                            supplier.supplierId
                                            ? 1
                                            : supplier.supplierId
                                        );
                                        field.onChange(supplier.supplierId);
                                        setOpenSupplier(false);
                                      }}
                                    >
                                      <Check
                                        className={
                                          selectedSupplierId ===
                                          supplier.supplierId
                                            ? "mr-2 h-4 w-4 opacity-100"
                                            : "mr-2 h-4 w-4 opacity-0"
                                        }
                                      />

                                      <div className="flex right-0 justify-between w-full">
                                        {supplier.companyName}
                                        <Button
                                          variant="ghost"
                                          onClick={() => {
                                            setSelectedSupplierId(
                                              supplier.supplierId
                                            );
                                            setHideDialogOpen(true);
                                          }}
                                          className="h-6 p-0 hidden group-hover:block hover:bg-red-200"
                                        >
                                          <Archive className="h-6 w-6 text-red-600" />
                                        </Button>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </div>
                                <CommandItem
                                  value="AddSupplier"
                                  onSelect={() => {
                                    setOpenSupplier(false);
                                  }}
                                  className="px-0 pb-1"
                                >
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-lg bg-red-600 hover:bg-red-900 text-white w-full text-left justify-start"
                                    onClick={() => {
                                      clearFilter();
                                    }}
                                  >
                                    <ArchiveRestore />
                                    Remove filters
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="rounded-lg bg-teal-600 hover:bg-teal-900 text-white w-full text-left justify-start"
                                    onClick={() => {
                                      setSupplierDialogOpen(true);
                                    }}
                                  >
                                    <PlusCircle className="" />
                                    Add Supplier
                                  </Button>
                                </CommandItem>
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
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <EditInput
                        type="number"
                        placeholder={cost}
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={notes}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent className="bg-white w-96">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight pb-2">
              <PlusCircle className="text-teal-500 size-5 -mt-0.5" />
              Add Supplier
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new supplier.
            </DialogDescription>
          </DialogHeader>
          <AddSupplier closeDialog={() => setSupplierDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="bg-white w-96">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight pb-2">
              <PlusCircle className="text-teal-500 size-5 -mt-0.5" />
              Add Category
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to add a new category.
            </DialogDescription>
          </DialogHeader>
          <AddCategory
            closeDialog={() => setCategoryDialogOpen(false)}
            shortName={shortName}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Archive className="text-red-500 size-5 -mt-0.5" />
              Hide Supplier
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <p className="text-left pt-2 text-sm">
            Are you sure you want to remove this supplier from your view?
          </p>
          <p className="text-left bg-red-300 -mt-2 relative py-2 text-sm">
            <span className="pl-4">
              By confirming, selected supplier will be hidden in every form.
            </span>
            <span className="absolute left-0 top-0 h-full w-2 bg-red-600"></span>
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={() => setHideDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setHideDialogOpen(false);
                addFilteredSupplier();
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditInventory;
