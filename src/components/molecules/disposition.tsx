"use client";
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
  Printer,
  Filter,
  ChevronsUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParams, useRouter } from "next/navigation";
import { DispositionSchema } from "@/packages/api/inventory";
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
import { DialogDescription } from "@radix-ui/react-dialog";
import EditDisposal from "../dialogs/disposal-edit";
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

interface DispositionValues {
  disposalId: number;
  userId: number;
  materialId: number;
  material: string;
  laboratory: string;
  itemDescription: string;
  qty: number;
  reasonForDisposal: string;
  disposalMethod: string;
  dateDisposed: string;
  disposedBy: string;
  comments: string;
  creationDate: string;
  dateUpdated: string;
}

const ITEMS_PER_PAGE = 4;

const Disposition = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [dispositions, setDispositions] = useState<DispositionValues[]>([]);
  const [filteredDisps, setFilteredDisps] = useState<DispositionValues[]>([]);
  const [search, setSearch] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDisposition, setSelectedDisposition] =
    useState<DispositionValues | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | undefined
  >(undefined);
  const [sortColumn, setSortColumn] = useState<keyof DispositionValues | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  const [isMaterialOpen, setIsMaterialOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Set<string>>(
    new Set()
  );
  const [isDisposedByOpen, setIsDisposedByOpen] = useState(false);
  const [selectedDisposedBy, setSelectedDisposedBy] = useState<Set<string>>(
    new Set()
  );

  const [dateDisposedFrom, setDateDisposedFrom] = useState("");
  const [dateDisposedTo, setDateDisposedTo] = useState("");
  const [creationDateFrom, setCreationDateFrom] = useState("");
  const [creationDateTo, setCreationDateTo] = useState("");

  useEffect(() => {
    if (!isEditDialogOpen) {
      const fetchMaterials = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}disposal`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch disposal forms");
          }
          const data = await response.json();

          const mappedDisposal = data.map((disposal: DispositionSchema) => ({
            ...disposal,
            laboratory: `${disposal.material.laboratory.labName}`,
            material: disposal.material.itemName,
            disposalMethod: disposal.disposalMethod,
          }));
          const disposedMaterials = mappedDisposal.filter(
            (disposal: DispositionValues) =>
              disposal.laboratory.toLowerCase() === labSlug
          );
          setDispositions(disposedMaterials);
          setFilteredDisps(disposedMaterials);
        } catch (error) {
          console.error("Error fetching forms:", error);
        }
      };

      fetchMaterials();
    }
  }, [labSlug, isEditDialogOpen]);

  const sortMaterials = (
    materials: DispositionValues[],
    key: keyof DispositionValues,
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

  const handleSort = (column: keyof DispositionValues) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = sortMaterials(filteredDisps, column, newDirection);
    setFilteredDisps(sorted);
  };

  useEffect(() => {
    const applyFilters = () => {
      const filtered = dispositions.filter((disposition) => {
        const matchesDisposedBy =
          selectedDisposedBy.size === 0 ||
          selectedDisposedBy.has(disposition.disposedBy);
        const matchesMaterial =
          selectedMaterial.size === 0 ||
          selectedMaterial.has(disposition.material);
        return matchesDisposedBy && matchesMaterial;
      });

      setFilteredDisps(filtered);
      setCurrentPage(1);
    };
    applyFilters();
  }, [selectedDisposedBy, selectedMaterial, dispositions]);

  const handleDisposedByChange = (disposedBy: string) => {
    setSelectedDisposedBy((prev) => {
      const updated = new Set(prev);
      if (updated.has(disposedBy)) {
        updated.delete(disposedBy);
      } else {
        updated.add(disposedBy);
      }
      return updated;
    });
  };

  const handleMaterialChange = (status: string) => {
    setSelectedMaterial((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredDisps(
      dispositions.filter((disposal) => {
        const combinedString = `${disposal.material} ${disposal.dateDisposed} ${disposal.disposedBy}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedMaterials = filteredDisps.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const tableHeaders = [
    "ID",
    "Material",
    "Description",
    "Quantity",
    "Reason for Disposal",
    "Disposal Method",
    "Date Disposed",
    "Disposed by",
    "Date Created",
    "Date Updated",
  ];
  const tableData = dispositions.map((disposition) => [
    disposition.disposalId,
    disposition.material,
    disposition.itemDescription,
    disposition.qty,
    disposition.reasonForDisposal,
    disposition.disposalMethod,
    new Date(disposition.dateDisposed).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    disposition.disposedBy,
    new Date(disposition.creationDate).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    new Date(disposition.dateUpdated).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ]);

  const singleTableData = selectedDisposition
    ? [
        [
          selectedDisposition.disposalId,
          selectedDisposition.material,
          selectedDisposition.itemDescription,
          selectedDisposition.qty,
          selectedDisposition.reasonForDisposal,
          selectedDisposition.disposalMethod,
          new Date(selectedDisposition.dateDisposed).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ),
          selectedDisposition.disposedBy,
          new Date(selectedDisposition.creationDate).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          new Date(selectedDisposition.dateUpdated).toLocaleString("en-US", {
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
    setDateDisposedFrom("");
    setDateDisposedTo("");
    setCreationDateFrom("");
    setCreationDateTo("");
  };

  const filterTableData = () => {
    return tableData.filter((row) => {
      const dateDisposed = new Date(row[6]);
      const creationDate = new Date(row[8]);

      const isDateDisposedInRange =
        (!dateDisposedFrom || dateDisposed >= new Date(dateDisposedFrom)) &&
        (!dateDisposedTo ||
          dateDisposed <=
            new Date(new Date(dateDisposedTo).setHours(23, 59, 59, 999)));

      const isCreationDateInRange =
        (!creationDateFrom || creationDate >= new Date(creationDateFrom)) &&
        (!creationDateTo ||
          creationDate <=
            new Date(new Date(creationDateTo).setHours(23, 59, 59, 999)));

      return isDateDisposedInRange && isCreationDateInRange;
    });
  };

  return (
    <div className=" p-8">
      <h1 className="text-3xl sm:text-2xl text-center sm:text-left font-semibold text-teal-700 mb-4">
        Disposition Forms
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
                    open={isDisposedByOpen}
                    onOpenChange={setIsDisposedByOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Disposed By</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(dispositions.map((m) => m.disposedBy))
                        ).map((disposedBy) => (
                          <label
                            key={disposedBy}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={disposedBy}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedDisposedBy.has(disposedBy)}
                              onChange={() =>
                                handleDisposedByChange(disposedBy)
                              }
                            />
                            <span>{disposedBy}</span>
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
                          new Set(dispositions.map((m) => m.material))
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
                      setSelectedDisposedBy(new Set());
                      setSelectedMaterial(new Set());
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
                router.push("/disposition-report");
              }}
            >
              <FilePlus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Dispose Materials
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
              <TableHead onClick={() => handleSort("disposalId")}>
                ID{" "}
                {sortColumn === "disposalId" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("material")}>
                Material{" "}
                {sortColumn === "material" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("itemDescription")}>
                Description{" "}
                {sortColumn === "itemDescription" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("qty")}>
                Quantity{" "}
                {sortColumn === "qty" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("reasonForDisposal")}>
                Reason for Disposal{" "}
                {sortColumn === "reasonForDisposal" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("disposalMethod")}>
                Disposal Method{" "}
                {sortColumn === "disposalMethod" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("dateDisposed")}>
                Date Disposed{" "}
                {sortColumn === "dateDisposed" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("userId")}>
                Disposed by{" "}
                {sortColumn === "userId" &&
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
            {paginatedMaterials.length > 0 ? (
              paginatedMaterials.map((disposition) => (
                <TableRow key={disposition.disposalId}>
                  <TableCell>{disposition.disposalId}</TableCell>
                  <TableCell>{disposition.material}</TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {disposition.itemDescription}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{disposition.itemDescription}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{disposition.qty}</TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {disposition.reasonForDisposal}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{disposition.reasonForDisposal}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {disposition.disposalMethod}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{disposition.disposalMethod}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {new Date(disposition.dateDisposed).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }
                    )}
                  </TableCell>
                  <TableCell>{disposition.disposedBy}</TableCell>
                  <TableCell>
                    {new Date(disposition.creationDate).toLocaleString(
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
                    {new Date(disposition.dateUpdated).toLocaleString("en-US", {
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
                        setSelectedDisposition(disposition);
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
                        setSelectedDisposition(disposition);
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
      </TooltipProvider>
      <CustomPagination
        totalItems={filteredDisps.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-h-4/5 sm:h-4/5 h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Edit className="text-teal-500 size-5 -mt-0.5" />
              Edit Disposal Form
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedDisposition && (
            <EditDisposal
              closeDialog={() => setIsEditDialogOpen(false)}
              disposalId={selectedDisposition.disposalId}
              userId={selectedDisposition.userId}
              materialId={selectedDisposition.materialId}
              itemDescription={selectedDisposition.itemDescription}
              qty={selectedDisposition.qty}
              reasonForDisposal={selectedDisposition.reasonForDisposal}
              disposalMethod={selectedDisposition.disposalMethod}
              dateDisposed={selectedDisposition.dateDisposed}
              disposedBy={selectedDisposition.disposedBy}
              comments={selectedDisposition.comments}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintAllOpen} onOpenChange={handlePrintDialogClose}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Printer className="text-teal-500 size-5 -mt-0.5" />
              Print Disposition Report
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Date Disposed From:</label>
              <Input
                type="date"
                value={dateDisposedFrom}
                onChange={(e) => setDateDisposedFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Date Disposed To:</label>
              <Input
                type="date"
                value={dateDisposedTo}
                onChange={(e) => setDateDisposedTo(e.target.value)}
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
              pdfTitle="Disposition Forms Report"
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
              Print Disposition Form
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
            {selectedDisposition && (
              <PdfForm
                pdfTitle="Disposition Form"
                pageSize={pageSize}
                orientation={orientation}
                tableHeaders={tableHeaders}
                tableData={singleTableData}
                materialName={selectedDisposition.material}
                closeDialog={() => setIsPrintDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Disposition;
