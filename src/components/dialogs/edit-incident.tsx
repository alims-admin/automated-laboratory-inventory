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
import TimePicker from "@/components/ui/timepicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronsUpDown, Paperclip } from "lucide-react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
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
import { MaterialSchema } from "@/packages/api/inventory";
import { UserSchema } from "@/packages/api/user";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface IncidentFormValues {
  date: string;
  time: string;
  natureOfIncident: string;
  qty: string;
  materialId: string;
  brand: string;
  remarks: string;
  userId: string;
  involvedIndividuals: string;
  materialsInvolved: string;
}
type EditIncidentProps = {
  closeDialog: () => void;
  incidentFormId: number;
} & IncidentFormValues;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IncidentEdit = ({
  incidentFormId,
  date,
  time,
  natureOfIncident,
  qty,
  materialId,
  brand,
  remarks,
  userId,
  involvedIndividuals,
  materialsInvolved,
  closeDialog,
}: EditIncidentProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openMaterial, setOpenMaterial] = useState(false);
  const currentUserId = localStorage.getItem("authToken");
  const [files, setFiles] = useState<File[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [users, setUsers] = useState<
    { userId: number; fullName: string; laboratory: string }[]
  >([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>(
    userId.split(",").map((id) => parseInt(id, 10))
  );

  const [selectedMaterials, setSelectedMaterials] = useState<
    { materialId: number; quantity: number; brand: string; itemName: string }[]
  >(
    materialId.split(",").map((id, index) => ({
      materialId: parseInt(id, 10),
      quantity: parseInt(qty.split(",")[index], 10),
      brand: brand.split(",")[index],
      itemName: materialsInvolved.split(",")[index],
    }))
  );
  const [materials, setMaterials] = useState<
    {
      materialId: number;
      laboratory: string;
      itemName: string;
      quantityAvailable: number;
    }[]
  >([]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const oversizedFiles = newFiles.filter(
        (file) => file.size > MAX_FILE_SIZE
      );
      if (oversizedFiles.length > 0) {
        setFileError(
          "One or more files exceed the maximum allowed size of 30MB"
        );
      } else {
        setFileError(null);
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      }
    }
  };

  const form = useForm<IncidentFormValues>({
    defaultValues: {
      date: date,
      time: time,
      natureOfIncident: natureOfIncident,
      qty: qty,
      materialId: materialId,
      brand: brand,
      remarks: remarks,
      userId: userId,
      involvedIndividuals: involvedIndividuals,
      materialsInvolved: materialsInvolved,
    },
  });
  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  const handleSubmit = async (values: IncidentFormValues) => {
    const involvedIndividuals = selectedUserIds
      .map((userId) => {
        const user = users.find((user) => user.userId === userId);
        return user ? user.fullName : null;
      })
      .filter((fullName) => fullName !== null)
      .join(",");

    const parsedValues = {
      date: format(new Date(values.date), "yyyy-MM-dd"),
      time: values.time,
      natureOfIncident: values.natureOfIncident,
      qty: selectedMaterials.map((material) => material.quantity).join(","),
      materialId: selectedMaterials
        .map((material) => material.materialId)
        .join(","),
      brand: selectedMaterials.map((material) => material.brand).join(", "),
      remarks: values.remarks,
      userId: selectedUserIds.map((user) => user).join(","),
      involvedIndividuals: involvedIndividuals,
      materialsInvolved: selectedMaterials
        .map((material) => material.itemName)
        .join(","),
    };
    const formData = new FormData();
    formData.append(
      "body",
      new Blob([JSON.stringify(parsedValues)], { type: "application/json" })
    );
    if (files) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }
    const laboratory = selectedMaterials
      ? materials
          .find(
            (material) =>
              material.materialId === selectedMaterials[0].materialId
          )
          ?.laboratory.toLowerCase() || ""
      : "";
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}incident-forms/${incidentFormId}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create incident form!");
      }

      toast.success("Incident form created successfully!");
      router.push(`lab/${laboratory.toLowerCase()}`);
    } catch (error) {
      toast.error("Submission failed. Please try again.");
    }
  };

  const handleMaterialSelect = (materialId: number) => {
    const materialExists = selectedMaterials.some(
      (item) => item.materialId === materialId
    );
    if (materialExists) {
      setSelectedMaterials((prevMaterials) =>
        prevMaterials.filter((item) => item.materialId !== materialId)
      );
    } else {
      const itemName =
        materials.find((material) => material.materialId === materialId)
          ?.itemName || "";
      setSelectedMaterials((prevMaterials) => [
        ...prevMaterials,
        { materialId, quantity: 0, brand: "", itemName },
      ]);
    }
  };

  const handleInputChange = (
    materialId: number,
    field: "quantity" | "brand",
    value: string
  ) => {
    setSelectedMaterials((prevMaterials) =>
      prevMaterials.map((item) =>
        item.materialId === materialId
          ? { ...item, [field]: field === "quantity" ? Number(value) : value }
          : item
      )
    );
  };
  const handleCheckboxChange = (userId: number) => {
    setSelectedUserIds((prevSelected) => {
      if (prevSelected.includes(userId)) {
        return prevSelected.filter((id) => id !== userId);
      } else {
        return [...prevSelected, userId];
      }
    });
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
          quantityAvailable: material.quantityAvailable ?? 0,
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
  }, [currentUserId]);

  return (
    <div className="justify-center">
      <Toaster />
      <div className="md:overflow-y-auto md:max-h-[450px]">
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
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Incident</FormLabel>
                    <FormControl>
                      <TimePicker
                        date={field.value}
                        setDate={(newTime: string) => field.onChange(newTime)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <FormField
                name="natureOfIncident"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature of Incident</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nature of Incident"
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
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 mb-4">
              <FormField
                name="materialId"
                render={({}) => (
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
                            selectedMaterials.length === 0
                              ? "text-gray-500"
                              : "text-black"
                          )}
                        >
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedMaterials.length > 0
                              ? `${selectedMaterials.length} selected`
                              : "Select items..."}
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
                                    <CommandItem key={material.materialId}>
                                      <input
                                        type="checkbox"
                                        id={`material-${material.materialId}`}
                                        checked={selectedMaterials.some(
                                          (item) =>
                                            item.materialId ===
                                            material.materialId
                                        )}
                                        onChange={() =>
                                          handleMaterialSelect(
                                            material.materialId
                                          )
                                        }
                                        className="mr-2 h-4 w-4"
                                      />
                                      <label
                                        htmlFor={`material-${material.materialId}`}
                                      >
                                        {material.itemName}
                                      </label>
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
            {selectedMaterials.map((selectedMaterial) => (
              <div
                className="grid grid-cols-3 gap-1 sm:gap-3 mb-4"
                key={selectedMaterial.materialId}
              >
                <FormField
                  name={`materialsInvolved[${selectedMaterial.materialId}]`}
                  render={({}) => (
                    <FormItem>
                      <FormLabel>Selected Item</FormLabel>
                      <FormControl>
                        <Input
                          type="string"
                          value={
                            materials.find(
                              (material) =>
                                material.materialId ===
                                selectedMaterial.materialId
                            )?.itemName || ""
                          }
                          className="w-full bg-teal-50"
                          readOnly
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`qty[${selectedMaterial.materialId}]`}
                  render={({}) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Quantity"
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value, 10);

                            if (
                              newValue >= 1 &&
                              newValue <=
                                (materials.find(
                                  (material) =>
                                    material.materialId ===
                                    selectedMaterial.materialId
                                )?.quantityAvailable || 100)
                            ) {
                              handleInputChange(
                                selectedMaterial.materialId,
                                "quantity",
                                newValue.toString()
                              );
                            }
                          }}
                          value={selectedMaterial.quantity}
                          required
                          min={1}
                          max={
                            materials.find(
                              (material) =>
                                material.materialId ===
                                selectedMaterial.materialId
                            )?.quantityAvailable ?? 1
                          }
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`brand[${selectedMaterial.materialId}]`}
                  render={({}) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brand name"
                          value={selectedMaterial.brand}
                          onChange={(e) =>
                            handleInputChange(
                              selectedMaterial.materialId,
                              "brand",
                              e.target.value
                            )
                          }
                          required
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}

            <div className="grid grid-cols-1 gap-3 mb-4">
              <FormField
                name="userIds"
                render={({}) => (
                  <FormItem>
                    <FormLabel>Personnels Involved</FormLabel>
                    <FormControl>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger
                          asChild
                          className={cn(
                            selectedUserIds.length === 0
                              ? "text-gray-500"
                              : "text-black"
                          )}
                        >
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedUserIds.length > 0
                              ? `${selectedUserIds.length} selected`
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
                                  <CommandItem key={user.userId}>
                                    <Input
                                      type="checkbox"
                                      id={`user-${user.userId}`}
                                      checked={selectedUserIds.includes(
                                        user.userId
                                      )}
                                      onChange={() =>
                                        handleCheckboxChange(user.userId)
                                      }
                                      className="mr-2 h-4 w-4 accent-cyan-200"
                                    />
                                    <label htmlFor={`user-${user.userId}`}>
                                      {user.fullName}
                                    </label>
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
                      <Input
                        placeholder="Remarks"
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
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Change Documentation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Choose files"
                        {...field}
                        className="w-full"
                        id="file_input"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                      />
                    </FormControl>
                    {fileError && <FormMessage>{fileError}</FormMessage>}
                  </FormItem>
                )}
              />
              {files.length > 0 && !fileError && (
                <div className="flex flex-col space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Button
                        variant="link"
                        onClick={() => {
                          setSelectedFile(file);
                          setIsPreviewOpen(true);
                        }}
                        type="button"
                        className="h-2 justify-start flex -mt-3 px-0 text-sm text-teal-600 italic bg-white"
                      >
                        View {file.name}
                      </Button>
                      <Button
                        variant="link"
                        onClick={() => handleRemoveFile(index)}
                        type="button"
                        className="h-2 justify-start flex -mt-3 px-0 text-sm text-red-600 italic bg-white"
                      >
                        X
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
              File Preview - {selectedFile?.name}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {selectedFile && (
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
                    uri: URL.createObjectURL(selectedFile),
                    fileName: selectedFile.name,
                  },
                ]}
                config={{
                  header: { disableHeader: true },
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentEdit;
