"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { useRouter } from "next/navigation";

interface CalibrationLogValues {
  materialId: number;
  calibrationDate: string;
  nextCalibration: string;
  notes: string;
  file: File;
  userId: number;
}

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const CalibrationLogForms = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("authToken");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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
      laboratory: string;
      itemName: string;
    }[]
  >([]);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [nextDateError, setNextDateError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files[0].size > MAX_FILE_SIZE) {
        setFileError("File size exceeds the maximum allowed size of 10MB");
      } else {
        setFileError(null);
        setFile(e.target.files[0]);
      }
    }
  };

  const form = useForm<CalibrationLogValues>({
    defaultValues: {
      userId: selectedUserId ?? Number(currentUserId),
      materialId: 0,
      calibrationDate: "",
      nextCalibration: "",
      notes: "",
    },
  });

  const handleSubmit = async (values: CalibrationLogValues) => {
    setDateError(null);
    setNextDateError(null);

    if (!values.calibrationDate) {
      setDateError("Calibration Date is required.");
      toast.error("Missing fields");
      return;
    }

    if (!values.nextCalibration) {
      setNextDateError("Next Calibration Date is required.");
      toast.error("Missing fields.");
      return;
    }

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
    if (file) {
      formData.append("file", file);
    }
    const laboratory = selectedMaterialId
      ? materials
          .find((material) => material.materialId === selectedMaterialId)
          ?.laboratory.toLowerCase() || ""
      : "";
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}calibration/create`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create calibration log!");
      }

      toast.success("Calibration log created successfully!");
      router.push(`lab/${laboratory.toLowerCase()}`);
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
            <div className="w-24 h-24 relative">
              <Image
                src="/images/mrl-logo.png"
                alt="Logo 1"
                fill
                style={{ objectFit: "contain" }}
                priority
                sizes="(max-width: 768px) 100vw, 24px"
              />
            </div>
            <div className="w-24 h-24 relative">
              <Image
                src="/images/pgh-logo.png"
                alt="Logo 2"
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 768px) 100vw, 24px"
              />
            </div>
          </div>
          <h1 className="text-xl font-bold py-1">Calibration Log Report</h1>
          <hr className="w-full border-t-1 border-gray-300 my-1" />
        </div>

        <Toaster />

        <div className="md:overflow-y-auto md:max-h-[400px] mb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="mb-4">
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
                      {dateError && <FormMessage>{dateError}</FormMessage>}
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
                      {nextDateError && (
                        <FormMessage>{nextDateError}</FormMessage>
                      )}
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
                      {selectedUserId === null && (
                        <FormMessage>Personnel is required.</FormMessage>
                      )}
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
                                : "Select item..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="flex p-0">
                            <Command>
                              <CommandInput placeholder="Search item..." />
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
                      {selectedMaterialId === null && (
                        <FormMessage>Material is required.</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <FormField
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documentation</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Choose file"
                          {...field}
                          required
                          className="w-full"
                          id="file_input"
                          type="file"
                          onChange={handleFileChange}
                        />
                      </FormControl>
                      {fileError && <FormMessage>{fileError}</FormMessage>}
                      {!file && <FormMessage>File is required.</FormMessage>}
                    </FormItem>
                  )}
                />
                {file && !fileError && (
                  <Button
                    variant="link"
                    onClick={() => setIsPreviewOpen(true)}
                    type="button"
                    className="h-2 ml-32 justify-start flex -mt-3 px-0 text-sm text-teal-600 italic bg-white"
                  >
                    View {file.name}
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
                          required
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
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-white max-h-4/5 h-fit max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 tracking-tight text-teal-900 mt-2">
              <Paperclip className="text-teal-900 size-5 -mt-0.5" />
              File Preview - {file?.name}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {file && (
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
                    uri: URL.createObjectURL(file),
                    fileName: file.name,
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

export default CalibrationLogForms;
