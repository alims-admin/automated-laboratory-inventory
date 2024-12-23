"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
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
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";

interface ChemicalFormValues {
  date: string;
  labId: string;
  category: number;
  personnel: number;
  itemName: string;
  itemCode: string;
  quantity: number;
  unit: string;
  location: string;
  expiryDate: string;
  supplier: number;
  cost: number;
  notes: string;
  reorderThreshold: number;
  maxThreshold: number;
}

const ChemicalInventoryForm = () => {
  const router = useRouter();
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
    null
  );
  const [suppliers, setSuppliers] = useState<
    { supplierId: number; companyName: string }[]
  >([]);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<
    number | null
  >(null);
  const [categories, setCategories] = useState<
    { categoryId: number; shortName: string; subcategory1: string }[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    number | null
  >(null);

  const validateForm = (values: ChemicalFormValues) => {
    const errors: Partial<Record<keyof ChemicalFormValues, string>> = {};

    if (!values.date) errors.date = "Date is required";
    if (!values.labId) errors.labId = "Laboratory is required";
    if (!values.category) errors.category = "Category is required";
    if (!values.personnel) errors.personnel = "Personnel is required";
    if (!values.itemName) errors.itemName = "Item Name is required";
    if (!values.itemCode) errors.itemCode = "Item Code is required";
    if (!values.quantity || values.quantity < 0)
      errors.quantity = "Quantity must be a positive number";
    if (!values.unit) errors.unit = "Unit is required";
    if (!values.location) errors.location = "Location is required";
    if (!values.expiryDate) errors.expiryDate = "Expiry Date is required";
    if (!values.supplier) errors.supplier = "Supplier is required";
    if (!values.cost || values.cost <= 0)
      errors.cost = "Cost must be a positive number";
    if (!values.reorderThreshold || values.reorderThreshold < 0)
      errors.reorderThreshold = "Reorder Threshold must be a positive number";
    if (!values.maxThreshold || values.maxThreshold < 0)
      errors.maxThreshold = "Max Threshold must be a positive number";

    return errors;
  };
  const form = useForm<ChemicalFormValues>({
    mode: "onChange",
    defaultValues: {
      date: "",
      labId: "",
      category: 0,
      personnel: 0,
      itemName: "",
      itemCode: "",
      quantity: 0,
      unit: "",
      location: "",
      expiryDate: "",
      supplier: 0,
      cost: 0,
      notes: "",
      reorderThreshold: 0,
      maxThreshold: 0,
    },
    resolver: async (values) => {
      const errors = validateForm(values);
      return {
        values: Object.keys(errors).length ? {} : values,
        errors: Object.keys(errors).reduce((acc, key) => {
          acc[key as keyof ChemicalFormValues] = {
            message: errors[key as keyof ChemicalFormValues] || "",
            type: "manual",
          };
          return acc;
        }, {} as Record<keyof ChemicalFormValues, { message: string; type: string }>),
      };
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
    setSelectedSupplierId(1);
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

  const handleSubmit = async (values: ChemicalFormValues) => {
    const parsedValues = {
      ...values,
      quantity: Number(values.quantity),
      cost: Number(values.cost),
      date: format(new Date(values.date), "yyyy-MM-dd"),
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
      notes: parsedValues.notes,
      quantityAvailable: 0,
      reorderThreshold: parsedValues.reorderThreshold,
      maxThreshold: parsedValues.maxThreshold,
    };

    const inventoryLogPayload = {
      userId: parsedValues.personnel,
      materialId: undefined,
      date: parsedValues.date,
      quantity: parsedValues.quantity,
      source: `Add ${parsedValues.quantity}`,
      remarks: "Initial Inventory",
    };

    try {
      const materialResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}material/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(materialPayload),
        }
      );

      if (!materialResponse.ok) {
        throw new Error("Failed to create material");
      }

      const materialData = await materialResponse.json();
      const materialId = materialData.materialId;

      inventoryLogPayload.materialId = materialId;

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

      toast.success("Material and inventory log added successfully!");
      const labName =
        Number(parsedValues.labId) === 1
          ? "pathology"
          : Number(parsedValues.labId) === 2
          ? "immunology"
          : Number(parsedValues.labId) === 3
          ? "microbiology"
          : "pathology";
      router.push(`/lab/${labName}`);
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

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}category/categories`
      );
      if (!response.ok) throw new Error("Failed to fetch categories");

      const data: Category[] = await response.json();
      const mappedCategories = data
        .filter((category) => category.shortName?.includes("Chemical"))
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

  useEffect(() => {
    if (!categoryDialogOpen) {
      fetchCategories();
    }
  }, [categoryDialogOpen]);

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
          <h1 className="text-lg md:text-xl font-bold py-1 text-center">
            Chemical Inventory Form
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
                  name="personnel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personnel</FormLabel>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <FormField
                  name="labId"
                  render={({ field }) => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <FormField
                  name="itemName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Item Name"
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
                  name="itemCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Item Code"
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Quantity"
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
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Unit (e.g., liters, grams)"
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
                  name="reorderThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reorder Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Minimum quantity to reorder"
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
                  name="maxThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Threshold</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Maximum quantity allowed"
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Location"
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
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
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
                                              ? null
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
                        <Input
                          type="number"
                          placeholder="Cost"
                          {...field}
                          required
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
                        placeholder="Any relevant information..."
                        {...field}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            shortName={"Chemical"}
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

export default ChemicalInventoryForm;
