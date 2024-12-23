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
import { Textarea } from "@/components/ui/textarea";
import { MaterialSchema } from "@/packages/api/inventory";
import { UserSchema } from "@/packages/api/user";
import { format } from "date-fns";

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

type EditDisposalProps = {
  closeDialog: () => void;
  disposalId: number;
} & DispositionReportValues;

const EditDisposal = ({
  disposalId,
  materialId,
  itemDescription,
  qty,
  reasonForDisposal,
  userId,
  disposalMethod,
  dateDisposed,
  comments,
  disposedBy,
  closeDialog,
}: EditDisposalProps) => {
  const [users, setUsers] = useState<
    { userId: number; fullName: string; laboratory: string }[]
  >([]);
  const [materials, setMaterials] = useState<
    {
      materialId: number;
      itemName: string;
      quantityAvailable: number;
      laboratory: string;
    }[]
  >([]);
  const [quantity, setQuantity] = useState<number>(qty);
  const getMaxQuantity = (): number => {
    const material = materials.find(
      (material) => material.materialId === materialId
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
      userId: userId,
      materialId: materialId,
      itemDescription: itemDescription,
      qty: qty,
      reasonForDisposal: reasonForDisposal,
      disposalMethod: disposalMethod,
      dateDisposed: dateDisposed,
      disposedBy: disposedBy,
      comments: comments,
    },
  });

  const handleSubmit = async (values: DispositionReportValues) => {
    const parsedValues = {
      ...values,
      qty: quantity,
      dateDisposed: format(new Date(values.dateDisposed), "yyyy-MM-dd"),
      disposedBy: users.find((user) => user.userId === userId)?.fullName || "",
    };
    try {
      const dispositionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}disposal/update/${disposalId}`,
        {
          method: "PUT",
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
        const mappedUsers = data.map((user) => ({
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
  }, []);
  return (
    <div className="justify-center">
      <Toaster />

      <div className="md:overflow-y-auto md:max-h-[400px] mb-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                name="disposedBy"
                render={({}) => (
                  <FormItem>
                    <FormLabel>Disposed By</FormLabel>
                    <FormControl>
                      <Input value={disposedBy} readOnly className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="materialId"
                render={({}) => (
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <FormControl>
                      <Input
                        value={
                          materials.find(
                            (material) => material.materialId === materialId
                          )?.itemName || ""
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

export default EditDisposal;
