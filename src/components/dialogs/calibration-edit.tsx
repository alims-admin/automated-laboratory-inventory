"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { useForm } from "react-hook-form";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Paperclip } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MaterialSchema } from "@/packages/api/inventory";
import { UserSchema } from "@/packages/api/user";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalibrationLogValues {
  materialId: number;
  calibrationDate: string;
  nextCalibration: string;
  notes: string;
  file: File | null;
  userId: number;
}

type EditCalibrationProps = {
  closeDialog: () => void;
  calibrationId: number;
} & CalibrationLogValues;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const EditCalibration = ({
  calibrationId,
  closeDialog,
  materialId,
  calibrationDate,
  nextCalibration,
  notes,
  userId,
}: EditCalibrationProps) => {
  const [open, setOpen] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [users, setUsers] = useState<
    { userId: number; fullName: string; laboratory: string }[]
  >([]);
  const [selectedUserId, setSelectedUserId] = React.useState<number | null>(
    userId ? Number(userId) : null
  );
  const [selectedMaterialId, setSelectedMaterialId] = React.useState<
    number | null
  >(materialId);
  const [materials, setMaterials] = useState<
    {
      materialId: number;
      itemName: string;
    }[]
  >([]);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files[0].size > MAX_FILE_SIZE) {
        setFileError("File size exceeds the maximum allowed size of 10MB");
      } else {
        setFileError(null);
        setFileUpload(e.target.files[0]);
      }
    }
  };
  const form = useForm<CalibrationLogValues>({
    defaultValues: {
      userId: userId,
      materialId: materialId,
      calibrationDate: calibrationDate,
      nextCalibration: nextCalibration,
      notes: notes,
    },
  });

  const handleSubmit = async (values: CalibrationLogValues) => {
    const parsedValues = {
      userId: values.userId,
      materialId: values.materialId,
      notes: values.notes,
      calibrationDate: format(new Date(values.calibrationDate), "yyyy-MM-dd"),
      nextCalibration: format(new Date(values.calibrationDate), "yyyy-MM-dd"),
    };

    const formData = new FormData();
    formData.append(
      "body",
      new Blob([JSON.stringify(parsedValues)], { type: "application/json" })
    );
    if (fileUpload) {
      formData.append("file", fileUpload);
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}calibration/update/${calibrationId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to edit calibration log!");
      }

      toast.success("Calibration log edited successfully!");
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

      <div className="md:overflow-y-auto md:max-h-[400px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="calibrationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calibration Date</FormLabel>
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
                name="nextCalibration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Calibration</FormLabel>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                name="userId"
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
              <FormField
                name="materialId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
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
                              <CommandEmpty>No equipment found.</CommandEmpty>
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
            </div>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <FormField
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Documentation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Choose file"
                        {...field}
                        className="w-full"
                        type="file"
                        onChange={handleFileChange}
                      />
                    </FormControl>
                    {fileError && <FormMessage>{fileError}</FormMessage>}
                  </FormItem>
                )}
              />
              {fileUpload && !fileError && (
                <Button
                  variant="link"
                  onClick={() => setIsPreviewOpen(true)}
                  type="button"
                  className="h-2 ml-32 justify-start flex -mt-3 px-0 text-sm text-teal-600 italic bg-white"
                >
                  View {fileUpload.name}
                </Button>
              )}
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
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-white max-h-4/5 h-fit max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 tracking-tight text-teal-900 mt-2">
              <Paperclip className="text-teal-900 size-5 -mt-0.5" />
              File Preview - {fileUpload?.name}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {fileUpload && (
            <div className="rounded-xl items-start justify-start top-0 h-full">
              <DocViewer
                theme={{ primary: "#D7F5E9", secondary: "#E4F8F0" }}
                style={{
                  borderRadius: "15px",
                  overflow: "auto",
                  display: "flex",
                  height: "500px",
                  backgroundColor: "#F1FBF7",
                }}
                pluginRenderers={DocViewerRenderers}
                documents={[
                  {
                    uri: URL.createObjectURL(fileUpload),
                    fileName: fileUpload.name,
                  },
                ]}
                config={{ header: { disableHeader: true } }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditCalibration;
