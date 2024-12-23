"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Supplier } from "@/packages/api/lab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronsUpDown,
  PlusCircle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import AddSupplier from "@/components/dialogs/supplier";
import { UserSchema } from "@/packages/api/user";
import { format } from "date-fns";
import { MaterialSchema } from "@/packages/api/inventory";
import { useRouter } from "next/navigation";

interface LabPurchaseValues {
  purchaseOrderNo: string;
  date: string;
  status: string;
  supplierId: number;
  supplierName: string;
  supplierAddress: string;
  supplierPhoneNo: string;
  supplierEmail: string;
  supplierContactPerson: string;
  labName: string;
  labAddress: string;
  labPhoneNo: string;
  labEmail: string;
  userId: number;
  items: {
    itemId: number;
    itemName: string;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  tax: number;
  shippingCost: number;
  totalPrice: number;
}

const LabPurchaseOrder = () => {
  const router = useRouter();
  const [openSupplier, setOpenSupplier] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [openMaterial, setOpenMaterial] = useState<boolean[]>([false]);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("authToken");
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [users, setUsers] = useState<
    {
      userId: number;
      fullName: string;
      email: string;
      phoneNumber: string;
      labId: number;
      laboratory: string;
      labAddress: string;
    }[]
  >([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = React.useState<
    number[]
  >([]);
  const [materials, setMaterials] = useState<
    {
      materialId: number;
      category: string;
      itemName: string;
      quantityAvailable: number;
    }[]
  >([]);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<
    number | null
  >(null);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    null
  );
  const [suppliers, setSuppliers] = useState<
    {
      supplierId: number;
      companyName: string;
      email: string;
      address: string;
      phoneNumber: string;
      contactPerson: string;
    }[]
  >([]);
  const form = useForm<LabPurchaseValues>({
    defaultValues: {
      purchaseOrderNo: "",
      date: "",
      status: "",
      supplierName: "",
      supplierAddress: "",
      supplierPhoneNo: "",
      supplierEmail: "",
      supplierContactPerson: "",
      labName: "",
      labAddress: "",
      labPhoneNo: "",
      labEmail: "",
      userId: 0,
      tax: 0,
      shippingCost: 0,
      totalPrice: 0,
      items: [
        {
          itemId: 0,
          itemName: "",
          category: "",
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
        },
      ],
    },
  });

  const [items, setItems] = useState<
    {
      itemId: number;
      itemName: string;
      category: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[]
  >([
    {
      itemName: "",
      itemId: 0,
      category: "",
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);

  const handleMaterialSelect = (index: number, materialId: number) => {
    const newSelectedMaterialIds = [...selectedMaterialIds];
    newSelectedMaterialIds[index] = materialId;
    setSelectedMaterialIds(newSelectedMaterialIds);

    const selectedMaterial = materials.find(
      (material) => material.materialId === materialId
    );

    if (selectedMaterial) {
      handleChange(index, {
        itemId: materialId,
        itemName: selectedMaterial.itemName,
        category: selectedMaterial.category,
      });
    }
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      {
        itemId: 0,
        itemName: "",
        category: "",
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
    setSelectedMaterialIds([...selectedMaterialIds, 0]);
    setOpenMaterial([...openMaterial, false]);
  };

  const handleRemoveRow = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);

    const newSelectedMaterialIds = [...selectedMaterialIds];
    newSelectedMaterialIds.splice(index, 1);
    setSelectedMaterialIds(newSelectedMaterialIds);

    const newOpenMaterial = [...openMaterial];
    newOpenMaterial.splice(index, 1);
    setOpenMaterial(newOpenMaterial);
  };

  const handleChange = (index: number, fields: Partial<(typeof items)[0]>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...fields };

    if (fields.quantity !== undefined || fields.unitPrice !== undefined) {
      const item = newItems[index];
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      item.totalPrice = quantity * unitPrice;
    }

    setItems(newItems);
  };

  const handleSubmit = async (values: LabPurchaseValues) => {
    if (!values.purchaseOrderNo) {
      toast.error("Purchase Order Number is required.");
      return;
    }
    if (!values.date) {
      toast.error("Date is required.");
      return;
    }
    if (!values.status) {
      toast.error("Status is required.");
      return;
    }
    if (!selectedSupplierId) {
      toast.error("Supplier is required.");
      return;
    }
    if (!selectedUserId) {
      toast.error("Contact Person is required.");
      return;
    }
    if (items.some((item) => item.itemId === 0)) {
      toast.error("An item must be selected.");
      return;
    }
    if (items.some((item) => item.quantity <= 0)) {
      toast.error("All items must have a quantity greater than 0.");
      return;
    }
    if (items.some((item) => item.unitPrice <= 0)) {
      toast.error("All items must have a unit price greater than 0.");
      return;
    }

    const tax =
      parseFloat((document.getElementById("tax") as HTMLInputElement)?.value) ||
      0;
    const shippingCost =
      parseFloat(
        (document.getElementById("shipping") as HTMLInputElement)?.value
      ) || 0;

    if (tax < 0) {
      toast.error("Tax cannot be negative.");
      return;
    }
    if (shippingCost < 0) {
      toast.error("Shipping cost cannot be negative.");
      return;
    }

    try {
      const grandTotal = parseFloat(calculateGrandTotal());

      const parsedValues = {
        ...values,
        items,
        tax,
        shippingCost,
        totalPrice: grandTotal,
        supplierName: selectedSupplierId
          ? suppliers.find(
              (supplier) => supplier.supplierId === selectedSupplierId
            )?.companyName || ""
          : "",
        supplierAddress: selectedSupplierId
          ? suppliers.find(
              (supplier) => supplier.supplierId === selectedSupplierId
            )?.address || ""
          : "",
        supplierPhoneNo: selectedSupplierId
          ? suppliers.find(
              (supplier) => supplier.supplierId === selectedSupplierId
            )?.phoneNumber || ""
          : "",
        supplierEmail: selectedSupplierId
          ? suppliers.find(
              (supplier) => supplier.supplierId === selectedSupplierId
            )?.email || ""
          : "",
        supplierContactPerson: selectedSupplierId
          ? suppliers.find(
              (supplier) => supplier.supplierId === selectedSupplierId
            )?.contactPerson || ""
          : "",
        labName: selectedUserId
          ? users.find((user) => user.userId === selectedUserId)?.laboratory ||
            ""
          : "",
        labAddress: selectedUserId
          ? users.find((user) => user.userId === selectedUserId)?.labAddress ||
            ""
          : "",
        labPhoneNo: selectedUserId
          ? users.find((user) => user.userId === selectedUserId)?.phoneNumber ||
            ""
          : "",
        labEmail: selectedUserId
          ? users.find((user) => user.userId === selectedUserId)?.laboratory ||
            ""
          : "",
        date: format(new Date(values.date), "yyyy-MM-dd"),
        labId: selectedUserId
          ? users.find((user) => user.userId === selectedUserId)?.labId || ""
          : "",
      };
      const purchaseOrder = {
        purchaseOrderNumber: parsedValues.purchaseOrderNo,
        userId: parsedValues.userId,
        supplierId: parsedValues.supplierId,
        date: parsedValues.date,
        shippingCost: parsedValues.shippingCost,
        totalPrice: parsedValues.totalPrice,
        status: parsedValues.status,
        tax: parsedValues.tax,
        labId: parsedValues.labId,
      };

      try {
        const purchaseOrderResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}purchase-order`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(purchaseOrder),
          }
        );

        if (!purchaseOrderResponse.ok) {
          throw new Error("Failed to create purchase order");
        }

        const purchaseOrderData = await purchaseOrderResponse.json();
        const purchaseOrderId = purchaseOrderData.purchaseOrderId;

        for (const item of items) {
          const purchaseItem = {
            purchaseOrderId: purchaseOrderId,
            materialId: item.itemId,
            description: item.itemName,
            qty: item.quantity,
            unitPrice: item.unitPrice,
          };

          const purchaseItemResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}purchase`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(purchaseItem),
            }
          );

          if (!purchaseItemResponse.ok) {
            throw new Error(
              `Failed to add item ${item.itemName} to purchase order`
            );
          }
        }
        toast.success("Purchase order form and items submitted successfully!");
        router.push(`lab/${parsedValues.labName.toLowerCase()}`);
      } catch (error) {
        toast.error(`Submission failed!`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Submission failed. Please try again.");
    }
  };

  function calculateGrandTotal() {
    const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const tax =
      parseFloat((document.getElementById("tax") as HTMLInputElement)?.value) ||
      0;
    const shippingCost =
      parseFloat(
        (document.getElementById("shipping") as HTMLInputElement)?.value
      ) || 0;

    const grandTotal = subtotal + (tax / 100) * subtotal + shippingCost;
    return grandTotal.toFixed(2);
  }

  function updateGrandTotal() {
    const grandTotalElement = document.getElementById("grand-total");
    if (grandTotalElement) {
      grandTotalElement.textContent = calculateGrandTotal();
    }
  }

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
          labAddress: user.laboratory.location,
          email: user.email ?? "",
          phoneNumber: user.phoneNumber ?? "",
          labId: user.labId,
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
            contactPerson: supplier.contactPerson,
            email: supplier.email,
            address: supplier.address,
            phoneNumber: supplier.phoneNumber,
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
    const fetchMaterials = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}material/all`
        );
        if (!response.ok) throw new Error("Failed to fetch materials");

        const data: MaterialSchema[] = await response.json();
        const mappedMaterials = data.map((material) => ({
          materialId: material.materialId ?? 0,
          quantityAvailable: material.quantityAvailable ?? 0,
          itemName: material.itemName,
          category: material.category.shortName,
        }));

        setMaterials(mappedMaterials);
      } catch (error) {
        console.error("Error fetching materials:", error);
      }
    };

    fetchMaterials();
  }, []);
  const handleMaterialPopoverOpenChange = (index: number, isOpen: boolean) => {
    const newOpenMaterial = [...openMaterial];
    newOpenMaterial[index] = isOpen;
    setOpenMaterial(newOpenMaterial);
  };
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
          <h1 className="text-xl font-bold py-1">
            Laboratory Purchase Order Form
          </h1>
          <hr className="w-full border-t-1 border-gray-300 my-1" />
        </div>

        <Toaster />

        <div className="overflow-y-auto max-h-[400px] mb-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <FormField
                  name="purchaseOrderNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Order Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Purchase Order Number"
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full flex justify-between items-center"
                          >
                            <span>{field.value || "Status"}</span>
                            <span className="ml-auto">▼</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          {[
                            "Submitted",
                            "Procurement Office",
                            "Accounting Office",
                            "Delivered",
                            "Cancelled",
                          ].map((option) => (
                            <DropdownMenuCheckboxItem
                              key={option}
                              checked={field.value === option}
                              onCheckedChange={(checked) => {
                                field.onChange(checked ? option : null);
                              }}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <h4 className="text-base font-bold pt-2">
                    Supplier Information
                  </h4>
                  <FormField
                    name="supplierId"
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
                                        supplier.supplierId ===
                                        selectedSupplierId
                                    )?.companyName
                                  : "Select supplier..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="flex p-0">
                              <Command>
                                <CommandInput placeholder="Search supplier..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No supplier found.
                                  </CommandEmpty>
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
                    name="supplierAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Supplier Address"
                            {...field}
                            value={
                              selectedSupplierId
                                ? suppliers.find(
                                    (supplier) =>
                                      supplier.supplierId === selectedSupplierId
                                  )?.address || ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="supplierPhoneNo"
                    render={({}) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Phone Number"
                            value={
                              selectedSupplierId
                                ? suppliers.find(
                                    (supplier) =>
                                      supplier.supplierId === selectedSupplierId
                                  )?.phoneNumber || ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="supplierEmail"
                    render={({}) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email Address"
                            value={
                              selectedSupplierId
                                ? suppliers.find(
                                    (supplier) =>
                                      supplier.supplierId === selectedSupplierId
                                  )?.email || ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="supplierContactPerson"
                    render={({}) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Contact Person"
                            value={
                              selectedSupplierId
                                ? suppliers.find(
                                    (supplier) =>
                                      supplier.supplierId === selectedSupplierId
                                  )?.contactPerson || ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <h4 className="text-base font-bold pt-2">
                    Buyer Information
                  </h4>
                  <FormField
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
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
                                  <CommandEmpty>
                                    No personnel found.
                                  </CommandEmpty>
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
                    name="labName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Laboratory Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Laboratory Name"
                            {...field}
                            value={
                              selectedUserId
                                ? users.find(
                                    (user) => user.userId === selectedUserId
                                  )?.laboratory ?? ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="labAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Laboratory Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Laboratory Address"
                            {...field}
                            value={
                              selectedUserId
                                ? users.find(
                                    (user) => user.userId === selectedUserId
                                  )?.labAddress ?? ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="labPhoneNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Phone Number"
                            {...field}
                            value={
                              selectedUserId
                                ? users.find(
                                    (user) => user.userId === selectedUserId
                                  )?.phoneNumber ?? ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="labEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email Adress"
                            {...field}
                            value={
                              selectedUserId
                                ? users.find(
                                    (user) => user.userId === selectedUserId
                                  )?.email ?? ""
                                : ""
                            }
                            readOnly
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="text-sm px-2 py-1 border">Item Name</th>
                      <th className="text-sm px-2 py-1 border text-nowrap">
                        Category
                      </th>
                      <th className="text-sm px-2 py-1 border">Quantity</th>
                      <th className="text-sm px-2 py-1 border">
                        Unit Price (Php)
                      </th>
                      <th className="text-sm px-2 py-1 border">
                        Total Price (Php)
                      </th>
                      <th className="text-sm px-2 py-1 border">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">
                          <Popover
                            open={openMaterial[index]}
                            onOpenChange={(isOpen) =>
                              handleMaterialPopoverOpenChange(index, isOpen)
                            }
                          >
                            <PopoverTrigger
                              asChild
                              className={cn(
                                selectedMaterialIds[index] === 0
                                  ? "text-gray-500"
                                  : "text-black"
                              )}
                            >
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between"
                              >
                                {selectedMaterialIds[index] !== 0
                                  ? materials.find(
                                      (material) =>
                                        material.materialId ===
                                        selectedMaterialIds[index]
                                    )?.itemName
                                  : "Select equipment..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="flex p-0">
                              <Command>
                                <CommandInput placeholder="Search equipment..." />
                                <CommandList>
                                  <CommandEmpty>
                                    No equipment found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    <div className="max-h-36 overflow-y-auto">
                                      {materials.map((material) => (
                                        <CommandItem
                                          key={material.materialId}
                                          value={material.itemName}
                                          onSelect={() => {
                                            if (
                                              !selectedMaterialIds.includes(
                                                material.materialId
                                              )
                                            ) {
                                              handleMaterialSelect(
                                                index,
                                                material.materialId
                                              );
                                              handleMaterialPopoverOpenChange(
                                                index,
                                                false
                                              );
                                            } else {
                                              toast.error(
                                                "Material already selected."
                                              );
                                            }
                                          }}
                                        >
                                          <Check
                                            className={
                                              selectedMaterialIds.includes(
                                                material.materialId
                                              )
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
                        </td>
                        <td className="border px-4 py-2 w-48">
                          <Input
                            value={
                              selectedMaterialIds[index] !== 0
                                ? materials.find(
                                    (material) =>
                                      material.materialId ===
                                      selectedMaterialIds[index]
                                  )?.category || ""
                                : ""
                            }
                            className="text-nowrap"
                            readOnly
                            placeholder="Category"
                          />
                        </td>
                        <td className="border px-4 py-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleChange(index, {
                                quantity: Number(e.target.value),
                              })
                            }
                            placeholder="Quantity"
                          />
                        </td>
                        <td className="border px-4 py-2">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleChange(index, {
                                unitPrice: Number(e.target.value),
                              })
                            }
                            placeholder="Unit Price"
                          />
                        </td>
                        <td className="border px-4 py-2">
                          <Input
                            type="number"
                            value={item.totalPrice}
                            readOnly
                            placeholder="Total Price"
                          />
                        </td>
                        <td className="border px-4 py-2 justify-center text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveRow(index)}
                            className="text-red-600 w-4"
                          >
                            X
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={6}>
                        <div className="flex justify-center">
                          <Button
                            onClick={handleAddRow}
                            type="button"
                            className="bg-amber-50 text-black hover:bg-amber-100 w-full"
                          >
                            Add New Row
                          </Button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="border px-4 py-2"></td>
                      <td colSpan={1} className="border px-4 py-2 text-sm">
                        Subtotal (₱):{" "}
                      </td>
                      <td colSpan={1} className="border px-6 py-2 text-sm">
                        {items
                          .reduce((acc, item) => acc + item.totalPrice, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="border px-4 py-2"></td>
                      <td colSpan={1} className="border px-4 py-2 text-sm">
                        Tax (%):{" "}
                      </td>
                      <td colSpan={4} className="border px-4 py-2">
                        <Input
                          type="number"
                          id="tax"
                          onInput={updateGrandTotal}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="border px-4 py-2"></td>
                      <td colSpan={1} className="border px-4 py-2 text-sm">
                        Shipping Cost (₱):{" "}
                      </td>
                      <td colSpan={1} className="border px-4 py-2">
                        <Input
                          type="number"
                          id="shipping"
                          onInput={updateGrandTotal}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="border px-4 py-2"></td>
                      <td
                        colSpan={1}
                        className="border px-4 py-2 text-sm font-bold"
                      >
                        Grand Total (₱):{" "}
                      </td>
                      <td
                        colSpan={2}
                        className="border px-6 py-2 text-sm font-bold"
                        id="grand-total"
                      >
                        {calculateGrandTotal()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center mt-5">
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

export default LabPurchaseOrder;
