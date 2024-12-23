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
} from "@/components/ui/form";
import { Category } from "@/packages/api/lab";

interface CreateCategoryProps {
  closeDialog: () => void;
  shortName: string;
}

const AddCategory: React.FC<CreateCategoryProps> = ({
  closeDialog,
  shortName,
}) => {
  const form = useForm<Category>();

  const handleRegister: SubmitHandler<Category> = async (values) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}category/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shortName: shortName,
            subcategory1: values.subcategory1,
          }),
        }
      );
      if (response.ok) {
        toast.success("Add category successful!");
        closeDialog();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Adding category failed!");
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
              name="subcategory1"
              render={({ field }) => (
                <FormItem className="mb-5 w-full">
                  <FormLabel>
                    Category <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="rounded-xl w-full border border-gray-300"
                      placeholder="Category"
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
                Add Category
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddCategory;
