import React, { useState, useEffect, useCallback } from "react";
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomPagination from "../ui/pagination-custom";
import { IncidentSchema } from "@/packages/api/inventory";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";
import PdfGenerator from "../templates/pdf-generator";
import PdfForm from "../templates/pdf-form";
import IncidentEdit from "../dialogs/edit-incident";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface IncidentValues {
  incidentFormId: number;
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
  file: string;
  attachments: string;
  fileType?: string;
  files: File[];
  creationDate: string;
  dateUpdated: string;
}

const ITEMS_PER_PAGE = 4;

const Incident = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [incidents, setIncidents] = useState<IncidentValues[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentValues[]>(
    []
  );
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
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentValues | null>(null);
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
  function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const byteArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }
    return byteArray;
  }
  const [sortColumn, setSortColumn] = useState<keyof IncidentValues | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [isPersonnelOpen, setIsPersonnelOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(
    new Set()
  );
  const [selectedIncidents, setSelectedIncidents] = useState<Set<string>>(
    new Set()
  );
  const [selectedPersonnels, setSelectedPersonnels] = useState<Set<string>>(
    new Set()
  );

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [creationDateFrom, setCreationDateFrom] = useState("");
  const [creationDateTo, setCreationDateTo] = useState("");

  useEffect(() => {
    if (!isEditDialogOpen) {
      const fetchMaterials = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}incident-forms`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch incident forms");
          }
          const data = await response.json();
          const mappedIncidents = data.map((incident: IncidentSchema) => {
            const fileTypes = incident.attachments
              ? incident.attachments.split(",")
              : [];

            const files =
              incident.files && Array.isArray(incident.files)
                ? incident.files.map((fileBase64: string, index: number) => {
                    const mimeType =
                      getMimeType(fileTypes[index]) ||
                      "application/octet-stream";
                    return new File(
                      [base64ToUint8Array(fileBase64)],
                      `${fileTypes[index]}`,
                      {
                        type: mimeType,
                      }
                    );
                  })
                : [];

            const attachments =
              incident.attachments && Array.isArray(incident.attachments)
                ? incident.attachments.map(
                    (attachmentBase64: string, index: number) => {
                      const mimeType =
                        fileTypes[index] || "application/octet-stream";
                      return new File(
                        [base64ToUint8Array(attachmentBase64)],
                        `attachment${index + 1}`,
                        {
                          type: mimeType,
                        }
                      );
                    }
                  )
                : [];

            const allFiles = [...files, ...attachments];

            return {
              ...incident,
              files: allFiles,
            };
          });

          setIncidents(mappedIncidents);
          setFilteredIncidents(mappedIncidents);
        } catch (error) {
          console.error("Error fetching incident forms:", error);
        }
      };

      fetchMaterials();
    }
  }, [labSlug, isEditDialogOpen]);

  const filterMaterials = useCallback(() => {
    const filtered = incidents.filter((material) => {
      const matchesMaterial =
        selectedMaterials.size === 0 ||
        selectedMaterials.has(material.materialsInvolved);

      const matchesIncidents =
        selectedIncidents.size === 0 ||
        selectedIncidents.has(material.natureOfIncident);

      const matchesPersonnels =
        selectedPersonnels.size === 0 ||
        selectedPersonnels.has(material.involvedIndividuals);

      return matchesMaterial && matchesIncidents && matchesPersonnels;
    });

    setFilteredIncidents(filtered);
    setCurrentPage(1);
  }, [incidents, selectedMaterials, selectedIncidents, selectedPersonnels]);

  const handleMaterialsChange = (materials: string) => {
    setSelectedMaterials((prev) => {
      const updated = new Set(prev);
      if (updated.has(materials)) {
        updated.delete(materials);
      } else {
        updated.add(materials);
      }
      return updated;
    });
  };

  const handleIncidentsChange = (incidents: string) => {
    setSelectedIncidents((prev) => {
      const updated = new Set(prev);
      if (updated.has(incidents)) {
        updated.delete(incidents);
      } else {
        updated.add(incidents);
      }
      return updated;
    });
  };

  const handlePersonnelsChange = (personnels: string) => {
    setSelectedPersonnels((prev) => {
      const updated = new Set(prev);
      if (updated.has(personnels)) {
        updated.delete(personnels);
      } else {
        updated.add(personnels);
      }
      return updated;
    });
  };

  useEffect(() => {
    filterMaterials();
  }, [
    selectedMaterials,
    selectedIncidents,
    selectedPersonnels,
    filterMaterials,
  ]);

  const sortMaterials = (
    materials: IncidentValues[],
    key: keyof IncidentValues,
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

  const handleSort = (column: keyof IncidentValues) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = sortMaterials(filteredIncidents, column, newDirection);
    setFilteredIncidents(sorted);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredIncidents(
      incidents.filter((incident) => {
        const combinedString = `${incident.materialsInvolved} ${incident.involvedIndividuals} ${incident.brand} ${incident.date}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const tableHeaders = [
    "ID",
    "Date",
    "Time",
    "Involved Material/s \nItem name (Brand) - Quantity",
    "Quantity",
    "Brand",
    "Nature of Incident",
    "Involved Personnel/s",
    "Remarks",
    "Attachments",
    "Date Created",
    "Date Updated",
  ];

  const singleTableData = selectedIncident
    ? [
        [
          selectedIncident.incidentFormId,
          new Date(selectedIncident.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          new Date(`1970-01-01T${selectedIncident.time}`).toLocaleTimeString(
            "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }
          ),
          selectedIncident.materialsInvolved
            .split(",")
            .map((material, index) => {
              const brands = selectedIncident.brand.split(",");
              const quantities = selectedIncident.qty.split(",");

              return `${material.trim()} (${
                brands[index]?.trim() || "N/A"
              }) - ${quantities[index]?.trim() || "N/A"}`;
            })
            .join("\n"),
          selectedIncident.qty,
          selectedIncident.brand,
          selectedIncident.natureOfIncident,
          selectedIncident.involvedIndividuals,
          selectedIncident.remarks,
          selectedIncident.attachments
            .split(",")
            .map((attachment: string) => attachment.trim())
            .join("\n"),
          new Date(selectedIncident.creationDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          new Date(selectedIncident.dateUpdated).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ],
      ]
    : [];

  const handlePrintDialogClose = () => {
    setIsPrintAllOpen(false);
    setIsPrintDialogOpen(false);
    setSelectedIncidents(new Set());
    setSelectedMaterials(new Set());
    setSelectedPersonnels(new Set());
    filterMaterials();
  };

  const filterByDate = (data: IncidentValues[]) => {
    return data.filter((incident) => {
      const incidentDate = new Date(incident.date);
      const incidentCreationDate = new Date(incident.creationDate);

      const isWithinDateRange =
        (!dateFrom || incidentDate >= new Date(dateFrom)) &&
        (!dateTo ||
          incidentDate <= new Date(new Date(dateTo).setHours(23, 59, 59, 999)));

      const isWithinCreationDateRange =
        (!creationDateFrom ||
          incidentCreationDate >= new Date(creationDateFrom)) &&
        (!creationDateTo ||
          incidentCreationDate <=
            new Date(new Date(creationDateTo).setHours(23, 59, 59, 999)));

      return isWithinDateRange && isWithinCreationDateRange;
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl sm:text-2xl text-center sm:text-left font-semibold text-teal-700 mb-4">
        Incident Forms
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
              <PopoverContent className="flex flex-col p-2 w-auto max-w-sm sm:max-w-lg max-h-96 overflow-y-auto overflow-x-hidden">
                <div className="flex flex-col items-start">
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
                        <span className="text-black">Materials</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(incidents.map((m) => m.materialsInvolved))
                        ).map((materialsInvolved) => (
                          <label
                            key={materialsInvolved}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={materialsInvolved}
                              checked={selectedMaterials.has(materialsInvolved)}
                              className="text-teal-500 accent-teal-200"
                              onChange={() =>
                                handleMaterialsChange(materialsInvolved)
                              }
                            />
                            <span>{materialsInvolved}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible
                    open={isIncidentOpen}
                    onOpenChange={setIsIncidentOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Incidents</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(incidents.map((m) => m.natureOfIncident))
                        ).map((natureOfIncident) => (
                          <label
                            key={natureOfIncident}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={natureOfIncident}
                              checked={selectedIncidents.has(natureOfIncident)}
                              className="text-teal-500 accent-teal-200"
                              onChange={() =>
                                handleIncidentsChange(natureOfIncident)
                              }
                            />
                            <span>{natureOfIncident}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
                        <span className="text-black">Personnels</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(
                            incidents
                              .map((m) => m.involvedIndividuals)
                              .filter(Boolean)
                          )
                        ).map((involvedIndividuals) => (
                          <label
                            key={involvedIndividuals}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={involvedIndividuals}
                              checked={selectedPersonnels.has(
                                involvedIndividuals
                              )}
                              className="text-teal-500 accent-teal-200"
                              onChange={() =>
                                handlePersonnelsChange(involvedIndividuals)
                              }
                            />
                            <span>{involvedIndividuals}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Button
                    variant="outline"
                    className="mt-2 w-full sticky bottom-0 bg-white hover:bg-gray-200"
                    onClick={() => {
                      setSelectedIncidents(new Set());
                      setSelectedMaterials(new Set());
                      setSelectedPersonnels(new Set());
                      filterMaterials();
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
                router.push("/incident-form");
              }}
            >
              <FilePlus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Report Incident
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
      <Table className="overflow-x-auto">
        <TableHeader className="text-center justify-center">
          <TableRow>
            <TableHead onClick={() => handleSort("incidentFormId")}>
              ID{" "}
              {sortColumn === "incidentFormId" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("date")}>
              Date{" "}
              {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("time")}>
              Time{" "}
              {sortColumn === "time" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("materialsInvolved")}>
              <div className="flex flex-col">
                <Label className="text-sm font-bold">
                  Material{" "}
                  {sortColumn === "materialsInvolved" &&
                    (sortDirection === "asc" ? "↑" : "↓")}
                </Label>
                <Label className="text-xs text-teal-600 text-nowrap">
                  Item name (Brand) - Quantity
                </Label>
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort("natureOfIncident")}>
              Nature of Incident{" "}
              {sortColumn === "natureOfIncident" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("involvedIndividuals")}>
              Involved Personnel/s{" "}
              {sortColumn === "involvedIndividuals" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("attachments")}>
              Attachment{" "}
              {sortColumn === "attachments" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("remarks")}>
              Remarks{" "}
              {sortColumn === "remarks" &&
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
          {paginatedIncidents.length > 0 ? (
            paginatedIncidents.map((incident) => (
              <TableRow key={incident.incidentFormId}>
                <TableCell>{incident.incidentFormId}</TableCell>
                <TableCell>
                  {new Date(incident.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  {new Date(`1970-01-01T${incident.time}`).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    }
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2 justify-center items-center text-center w-full">
                    {incident.materialsInvolved
                      .split(",")
                      .map((material, index) => (
                        <div key={index} className="flex flex-row gap-3">
                          <p className="text-nowrap">
                            {material.trim()} (
                            {incident.brand.split(",")[index].trim()}) -{" "}
                            {incident.qty.split(",")[index].trim()}
                          </p>
                        </div>
                      ))}
                  </div>
                </TableCell>
                <TableCell>{incident.natureOfIncident}</TableCell>
                <TableCell>{incident.involvedIndividuals}</TableCell>
                <TableCell className="justify-start text-left">
                  {incident.files &&
                    incident.files.map((file: File, index: number) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-teal-600 hover:text-teal-900 hover:bg-teal-50"
                        onClick={() => {
                          setIsPreviewOpen(true);
                          setSelectedFile(file);
                        }}
                      >
                        <Paperclip className="w-4 h-4 -mr-0.5" /> {file.name}
                      </Button>
                    ))}
                </TableCell>
                <TableCell>{incident.remarks}</TableCell>
                <TableCell>
                  {new Date(incident.creationDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  {new Date(incident.dateUpdated).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-md text-cyan-600 hover:text-cyan-900 hover:bg-cyan-50"
                    onClick={() => {
                      setSelectedIncident(incident);
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
                      setSelectedIncident(incident);
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
              <TableCell colSpan={11} className="text-center text-gray-500">
                No materials found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <CustomPagination
        totalItems={filteredIncidents.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-h-4/5 sm:h-4/5 h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Edit className="text-teal-500 size-5 -mt-0.5" />
              Edit Incident Form
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <IncidentEdit
              closeDialog={() => setIsEditDialogOpen(false)}
              incidentFormId={selectedIncident.incidentFormId}
              date={selectedIncident.date}
              time={selectedIncident.time}
              natureOfIncident={selectedIncident.natureOfIncident}
              qty={selectedIncident.qty}
              materialId={selectedIncident.materialId}
              brand={selectedIncident.brand}
              remarks={selectedIncident.remarks}
              userId={selectedIncident.userId}
              involvedIndividuals={selectedIncident.involvedIndividuals}
              materialsInvolved={selectedIncident.materialsInvolved}
            />
          )}
        </DialogContent>
      </Dialog>
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

      <Dialog open={isPrintAllOpen} onOpenChange={handlePrintDialogClose}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              Print Incident Forms
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Date From:</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Date To:</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
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
              pdfTitle="Incident Report"
              pageSize="long"
              orientation="landscape"
              tableHeaders={tableHeaders}
              tableData={filterByDate(incidents).map((incident) => [
                incident.incidentFormId,
                new Date(incident.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }),
                new Date(`1970-01-01T${incident.time}`).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  }
                ),
                incident.materialsInvolved
                  .split(",")
                  .map((material, index) => {
                    const brands = incident.brand.split(",");
                    const quantities = incident.qty.split(",");

                    return `${material.trim()} (${
                      brands[index]?.trim() || "N/A"
                    }) - ${quantities[index]?.trim() || "N/A"}`;
                  })
                  .join("\n"),
                incident.qty,
                incident.brand,
                incident.natureOfIncident,
                incident.involvedIndividuals,
                incident.remarks,
                incident.attachments
                  .split(",")
                  .map((attachment: string) => attachment.trim())
                  .join("\n"),
                new Date(incident.creationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                new Date(incident.dateUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              ])}
              closeDialog={handlePrintDialogClose}
            ></PdfGenerator>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              Print Incident Form
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
            {selectedIncident && (
              <PdfForm
                pdfTitle="Incident Form"
                pageSize={pageSize}
                orientation={orientation}
                tableHeaders={tableHeaders}
                tableData={singleTableData}
                materialName={selectedIncident.natureOfIncident}
                closeDialog={() => setIsPrintDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Incident;
