import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Search,
  FilePlus,
  Paperclip,
  Printer,
  Filter,
  ChevronsUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomPagination from "../ui/pagination-custom";
import { CalibrationSchema } from "@/packages/api/inventory";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import Image from "next/image";
import EditCalibration from "../dialogs/calibration-edit";
import PdfGenerator from "../templates/pdf-generator";
import PdfForm from "../templates/pdf-form";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "../ui/separator";

interface CalibrationLogValues {
  calibrationId: number;
  materialId: number;
  material: string;
  calibrationDate: string;
  nextCalibration: string;
  notes: string;
  file: string;
  userId: number;
  user: string;
  laboratory: string;
  fileName: string;
  creationDate: string;
  dateUpdated: string;
}

const ITEMS_PER_PAGE = 4;

const CalibrationLogs = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [calibrations, setCalibrations] = useState<CalibrationLogValues[]>([]);
  const [filteredCalibrations, setFilteredCalibrations] = useState<
    CalibrationLogValues[]
  >([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | undefined
  >(undefined);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [selectedCalibration, setSelectedCalibration] =
    useState<CalibrationLogValues | null>(null);
  const getMimeType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "application/pdf";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "doc":
      case "docx":
        return "application/msword";
      case "txt":
        return "text/plain";
      case "xlsx":
      case "xls":
        return "application/vnd.ms-excel";
      case "pptx":
      case "ppt":
        return "application/vnd.ms-powerpoint";
      case "mp4":
        return "video/mp4";
      case "mkv":
        return "video/x-matroska";
      default:
        return "application/octet-stream";
    }
  };
  const [sortColumn, setSortColumn] = useState<
    keyof CalibrationLogValues | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );
  const [isPersonnelOpen, setIsPersonnelOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Set<string>>(
    new Set()
  );
  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Set<string>>(
    new Set()
  );

  const [dateBorrowedFrom, setDateBorrowedFrom] = useState("");
  const [dateBorrowedTo, setDateBorrowedTo] = useState("");
  const [dateReturnedFrom, setDateReturnedFrom] = useState("");
  const [dateReturnedTo, setDateReturnedTo] = useState("");
  const [creationDateFrom, setCreationDateFrom] = useState("");
  const [creationDateTo, setCreationDateTo] = useState("");
  const handlePrintDialogClose = () => setIsPrintAllOpen(false);

  useEffect(() => {
    if (!isEditDialogOpen) {
      const fetchMaterials = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}calibration`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch calibration logs");
          }
          const data = await response.json();
          const mappedCalibrations = data.map(
            (calibration: CalibrationSchema) => ({
              ...calibration,
              user: `${calibration.user.firstName} ${
                calibration.user.middleName
                  ? calibration.user.middleName + " "
                  : ""
              }${calibration.user.lastName}`,
              material: calibration.material.itemName,
              laboratory: calibration.material.laboratory.labName,
              file: calibration.file,
              fileName: calibration.attachments,
            })
          );

          const laboratoryFilter = mappedCalibrations.filter(
            (calibration: CalibrationLogValues) =>
              calibration.laboratory.toLowerCase() === labSlug
          );
          setCalibrations(laboratoryFilter);
          setFilteredCalibrations(laboratoryFilter);
        } catch (error) {
          console.error("Error fetching calibrations:", error);
        }
      };

      fetchMaterials();
    }
  }, [labSlug, isEditDialogOpen]);
  const sortMaterials = (
    materials: CalibrationLogValues[],
    key: keyof CalibrationLogValues,
    order: "asc" | "desc"
  ) => {
    return [...materials].sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];

      if (typeof valueA === "string" && typeof valueB === "string") {
        return order === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      if (typeof valueA === "number" && typeof valueB === "number") {
        return order === "asc" ? valueA - valueB : valueB - valueA;
      }
      return 0;
    });
  };

  const handleSort = (column: keyof CalibrationLogValues) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = sortMaterials(filteredCalibrations, column, newDirection);
    setFilteredCalibrations(sorted);
  };
  useEffect(() => {
    const applyFilters = () => {
      const filtered = calibrations.filter((calibration) => {
        const matchesMaterial =
          selectedMaterial.size === 0 ||
          selectedMaterial.has(calibration.material);
        const matchesPersonnel =
          selectedPersonnel.size === 0 ||
          selectedPersonnel.has(calibration.user);
        return matchesPersonnel && matchesMaterial;
      });

      setFilteredCalibrations(filtered);
      setCurrentPage(1);
    };
    applyFilters();
  }, [selectedPersonnel, selectedMaterial, calibrations]);

  const handlePersonnelChange = (personnel: string) => {
    setSelectedPersonnel((prev) => {
      const updated = new Set(prev);
      if (updated.has(personnel)) {
        updated.delete(personnel);
      } else {
        updated.add(personnel);
      }
      return updated;
    });
  };
  const handleMaterialChange = (material: string) => {
    setSelectedMaterial((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(material)) {
        newSet.delete(material);
      } else {
        newSet.add(material);
      }
      return newSet;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredCalibrations(
      calibrations.filter((calibration) => {
        const combinedString = `${calibration.material} ${calibration.user} ${calibration.notes} ${calibration.fileName}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedCalibrations = filteredCalibrations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const renderFile = (file: string, fileName: string) => {
    const mimeType = getMimeType(fileName);

    if (mimeType.startsWith("video/")) {
      return (
        <div className="flex justify-center items-start">
          <video
            controls
            style={{ width: "100%", height: "300px" }}
            className="flex justify-start items-start"
          >
            <source src={`data:${mimeType};base64,${file}`} type={mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (mimeType === "application/pdf") {
      return (
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
              uri: `data:${mimeType};base64,${file}`,
              fileName: fileName,
            },
          ]}
          prefetchMethod="GET"
          config={{ header: { disableHeader: true } }}
        />
      );
    }

    if (mimeType.startsWith("image/")) {
      return (
        <div className="flex flex-col justify-end items-end">
          <Image
            src={`data:${mimeType};base64,${file}`}
            alt="File preview"
            width={100}
            height={100}
            style={{ width: "100%", height: "auto" }}
          />
          <a
            href={`data:${mimeType};base64,${file}`}
            download={fileName}
            className="text-teal-800 flex justify-center rounded-xl bg-teal-200 h-10 w-28 p-2 mt-4 hover:bg-teal-500"
          >
            Download
          </a>
        </div>
      );
    }

    return (
      <div>
        <p>
          Unsupported file type.
          <a
            href={`data:${mimeType};base64,${file}`}
            download={fileName}
            className="text-teal-800 italic underline-offset-2 underline"
          >
            Click here to download the file.
          </a>
        </p>
      </div>
    );
  };

  const tableHeaders = [
    "ID",
    "Item Name",
    "Personnel",
    "Calibration Date",
    "Next Calibration",
    "Notes",
    "Attachment",
    "Date Created",
    "Date Updated",
  ];
  const tableData = calibrations.map((calibration) => [
    calibration.calibrationId,
    calibration.material,
    calibration.user,
    new Date(calibration.calibrationDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    new Date(calibration.nextCalibration).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    calibration.notes,
    calibration.fileName,
    new Date(calibration.creationDate).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    new Date(calibration.dateUpdated).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ]);

  const singleTableData = selectedCalibration
    ? [
        [
          selectedCalibration.calibrationId,
          selectedCalibration.material,
          selectedCalibration.user,
          new Date(selectedCalibration.calibrationDate).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ),
          new Date(selectedCalibration.nextCalibration).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ),
          selectedCalibration.notes,
          selectedCalibration.fileName,
          new Date(selectedCalibration.creationDate).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          new Date(selectedCalibration.dateUpdated).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ],
      ]
    : [];

  const filterTableData = () => {
    return tableData.filter((calibration) => {
      const calibrationDate = new Date(calibration[3]);
      const nextCalibrationDate = new Date(calibration[4]);
      const creationDate = new Date(calibration[7]);

      const matchesCalibrationDate =
        (!dateBorrowedFrom || calibrationDate >= new Date(dateBorrowedFrom)) &&
        (!dateBorrowedTo ||
          calibrationDate <=
            new Date(new Date(dateBorrowedTo).setHours(23, 59, 59, 999)));
      const matchesNextCalibrationDate =
        (!dateReturnedFrom ||
          nextCalibrationDate >= new Date(dateReturnedFrom)) &&
        (!dateReturnedTo ||
          nextCalibrationDate <=
            new Date(new Date(dateReturnedTo).setHours(23, 59, 59, 999)));
      const matchesCreationDate =
        (!creationDateFrom || creationDate >= new Date(creationDateFrom)) &&
        (!creationDateTo ||
          creationDate <=
            new Date(new Date(creationDateTo).setHours(23, 59, 59, 999)));

      return (
        matchesCalibrationDate &&
        matchesNextCalibrationDate &&
        matchesCreationDate
      );
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl sm:text-2xl text-center sm:text-left font-semibold text-teal-700 mb-4">
        Calibration Logs
      </h1>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex flex-col md:flex-row w-full items-center gap-1.5 md:gap-1">
          <div className="flex gap-2 w-full md:w-auto ">
            <div className="relative md:w-auto w-full">
              <Input
                placeholder="Search for an entry"
                value={search}
                onChange={handleSearch}
                className="w-full md:w-80 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-500" />
              </span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    `bg-teal-500 text-white w-auto justify-center rounded-lg hover:bg-teal-700 transition-colors duration-300 ease-in-out flex items-center`
                  )}
                >
                  <Filter /> <span className="lg:flex hidden">Filter</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col p-2 w-auto max-w-sm sm:max-w-lg  max-h-96 overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col items-start">
                  <Collapsible
                    open={isPersonnelOpen}
                    onOpenChange={setIsPersonnelOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Personnel</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(calibrations.map((m) => m.user))
                        ).map((user) => (
                          <label
                            key={user}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={user}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedPersonnel.has(user)}
                              onChange={() => handlePersonnelChange(user)}
                            />
                            <span>{user}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible
                    open={isMaterialOpen}
                    onOpenChange={setIsMaterialOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Material</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(calibrations.map((m) => m.material))
                        ).map((material) => (
                          <label
                            key={material}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={material}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedMaterial.has(material)}
                              onChange={() => handleMaterialChange(material)}
                            />
                            <span>{material}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Button
                    variant="outline"
                    className="mt-2 w-full sticky bottom-0 bg-white hover:bg-gray-200"
                    onClick={() => {
                      setSelectedPersonnel(new Set());
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center w-full justify-between gap-2">
            <Button
              className="flex items-center bg-teal-500 w-1/2 text-white md:w-auto justify-center rounded-lg hover:bg-teal-700 transition-colors duration-300 ease-in-out"
              onClick={() => {
                router.push("/calibration-log-form");
              }}
            >
              <FilePlus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Calibrate Equipment
              </span>
            </Button>

            <Button
              className="flex md:w-1/4 items-center bg-teal-800 text-white w-1/2 justify-center rounded-lg hover:bg-teal-950 transition-colors duration-300 ease-in-out"
              onClick={() => {
                setIsPrintAllOpen(true);
              }}
            >
              <Printer className="w-4 h-4" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Print Forms
              </span>
            </Button>
          </div>
        </div>
      </div>
      <Toaster />
      <TooltipProvider>
        <Table className="overflow-x-auto">
          <TableHeader className="text-center justify-center">
            <TableRow>
              <TableHead onClick={() => handleSort("calibrationId")}>
                ID{" "}
                {sortColumn === "calibrationId" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("material")}>
                Item Name{" "}
                {sortColumn === "material" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("user")}>
                Personnel{" "}
                {sortColumn === "user" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("calibrationDate")}>
                Calibration Date{" "}
                {sortColumn === "calibrationDate" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("nextCalibration")}>
                Next Calibration{" "}
                {sortColumn === "nextCalibration" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("fileName")}>
                Attachment{" "}
                {sortColumn === "fileName" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("notes")}>
                Notes{" "}
                {sortColumn === "notes" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("creationDate")}>
                Created At{" "}
                {sortColumn === "creationDate" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                onClick={() => handleSort("dateUpdated")}
                className="text-nowrap"
              >
                Updated At{" "}
                {sortColumn === "dateUpdated" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCalibrations.length > 0 ? (
              paginatedCalibrations.map((calibration) => (
                <TableRow key={calibration.calibrationId}>
                  <TableCell>{calibration.calibrationId}</TableCell>
                  <TableCell>{calibration.material}</TableCell>
                  <TableCell>{calibration.user}</TableCell>
                  <TableCell>
                    {new Date(calibration.calibrationDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(calibration.nextCalibration).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-md text-teal-600 hover:text-teal-900 hover:bg-teal-50"
                      onClick={() => {
                        setSelectedCalibration(calibration);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Paperclip className="w-4 h-4 -mr-0.5" /> View Attachment
                    </Button>
                  </TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {calibration.notes}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{calibration.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {new Date(calibration.creationDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(calibration.dateUpdated).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-md text-cyan-600 hover:text-cyan-900 hover:bg-cyan-50"
                      onClick={() => {
                        setSelectedCalibration(calibration);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 -mr-0.5" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-md text-black-600 hover:text-black-900 hover:bg-black-50"
                      onClick={() => {
                        setSelectedCalibration(calibration);
                        setIsPrintDialogOpen(true);
                      }}
                    >
                      <Printer className="w-4 h-4 -mr-1" /> Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500">
                  No materials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
      <CustomPagination
        totalItems={filteredCalibrations.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-h-4/5 sm:h-4/5 h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Edit className="text-teal-500 size-5 -mt-0.5" />
              Edit Calibration
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedCalibration && (
            <EditCalibration
              closeDialog={() => setIsEditDialogOpen(false)}
              calibrationId={selectedCalibration.calibrationId}
              materialId={selectedCalibration.materialId}
              calibrationDate={selectedCalibration.calibrationDate}
              nextCalibration={selectedCalibration.nextCalibration}
              notes={selectedCalibration.notes}
              file={null}
              userId={selectedCalibration.userId}
            ></EditCalibration>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-white max-h-svh h-auto max-w-2xl overflow-y-auto flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 tracking-tight text-teal-900 mt-2">
              <Paperclip className="text-teal-900 size-5 -mt-0.5" />
              File Preview - {selectedCalibration?.fileName}
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {selectedCalibration?.file && (
            <div className="rounded-xl items-start justify-start top-0 h-full">
              {renderFile(
                selectedCalibration.file,
                selectedCalibration.fileName
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintAllOpen} onOpenChange={handlePrintDialogClose}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Printer className="text-teal-500 size-5 -mt-0.5" />
              Print Calibration Report
            </DialogTitle>
          </DialogHeader>
          <DialogDescription></DialogDescription>

          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Calibration Date From:</label>
              <Input
                type="date"
                value={dateBorrowedFrom}
                onChange={(e) => setDateBorrowedFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Calibration Date To:</label>
              <Input
                type="date"
                value={dateBorrowedTo}
                onChange={(e) => setDateBorrowedTo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Next Calibration Date From:</label>
              <Input
                type="date"
                value={dateReturnedFrom}
                onChange={(e) => setDateReturnedFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Next Calibration Date To:</label>
              <Input
                type="date"
                value={dateReturnedTo}
                onChange={(e) => setDateReturnedTo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Creation Date From:</label>
              <Input
                type="date"
                value={creationDateFrom}
                onChange={(e) => setCreationDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Creation Date To:</label>
              <Input
                type="date"
                value={creationDateTo}
                onChange={(e) => setCreationDateTo(e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="gap-1 bg-teal-50 p-4 rounded-md">
            <p className="text-center pb-2 text-teal-800 text-base">
              Are you sure you want to print this form?
            </p>
            <p className="text-left text-xs text-teal-600 italic">
              *This form shall be printed in a long bond paper.
            </p>
            <p className="text-left text-xs text-teal-600 -mt-1 italic">
              *Selecting nothing will print all forms.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={handlePrintDialogClose}
            >
              Cancel
            </Button>
            <PdfGenerator
              pdfTitle="Calibration Report"
              pageSize="long"
              orientation="landscape"
              tableHeaders={tableHeaders}
              tableData={filterTableData()}
              closeDialog={handlePrintDialogClose}
            ></PdfGenerator>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              Print Borrow Form
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <p className="text-left pt-2 text-m">
            Select page size for the form:
          </p>
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center"
                >
                  <span className={pageSize ? "text-black" : "text-gray-500"}>
                    {pageSize === "a4"
                      ? "A4 (210 x 297 mm)"
                      : pageSize === "short"
                      ? "Short (Letter, 215.9 x 279.4 mm)"
                      : pageSize === "long"
                      ? "Long (Legal, 215.9 x 355.6 mm)"
                      : "Select Page Size"}
                  </span>
                  <span className="ml-auto">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[
                  { label: "A4 (210 x 297 mm)", value: "a4" },
                  { label: "Short (Letter, 215.9 x 279.4 mm)", value: "short" },
                  { label: "Long (Legal, 215.9 x 355.6 mm)", value: "long" },
                ].map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={pageSize === option.value}
                    onCheckedChange={(checked) =>
                      setPageSize(checked ? option.value : "a4")
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-left pt-4 text-m">
            Select orientation for the form:
          </p>
          <div className="flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full flex justify-between items-center"
                >
                  <span
                    className={orientation ? "text-black" : "text-gray-500"}
                  >
                    {orientation === "portrait"
                      ? "Portrait"
                      : orientation === "landscape"
                      ? "Landscape"
                      : "Select Orientation"}
                  </span>
                  <span className="ml-auto">▼</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[
                  { label: "Portrait", value: "portrait" as const },
                  { label: "Landscape", value: "landscape" as const },
                ].map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={orientation === option.value}
                    onCheckedChange={(checked) =>
                      setOrientation(checked ? option.value : "portrait")
                    }
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={() => setIsPrintDialogOpen(false)}
            >
              Cancel
            </Button>
            {selectedCalibration && selectedCalibration?.file && (
              <PdfForm
                pdfTitle="Calibration Form"
                pageSize={pageSize}
                orientation={orientation}
                tableHeaders={tableHeaders}
                tableData={singleTableData}
                materialName={selectedCalibration.material}
                closeDialog={() => setIsPrintDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalibrationLogs;
