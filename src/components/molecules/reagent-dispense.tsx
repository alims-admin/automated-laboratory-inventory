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
import { ReagentDispenseSchema } from "@/packages/api/inventory";
import EditReagentDispense from "../dialogs/reagent-dispense-edit";
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

interface ReagentDispenseValues {
  dispenseId: number;
  date: string;
  reagentId: number;
  name: string;
  totalNoContainers: number;
  lotNo: string;
  qtyDispensed: number;
  remarks: string;
  userId: number;
  analyst: string;
  laboratory: string;
  remainingQuantity: number;
  creationDate: string;
  dateUpdated: string;
}

const ITEMS_PER_PAGE = 4;

const ReagentDispense = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [dispenses, setDispenses] = useState<ReagentDispenseValues[]>([]);
  const [filteredDispenses, setFilteredDispenses] = useState<
    ReagentDispenseValues[]
  >([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDispense, setSelectedDispense] =
    useState<ReagentDispenseValues | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | undefined
  >(undefined);
  const [sortColumn, setSortColumn] = useState<
    keyof ReagentDispenseValues | null
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

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [creationDateFrom, setCreationDateFrom] = useState("");
  const [creationDateTo, setCreationDateTo] = useState("");

  const handlePrintDialogClose = () => {
    setIsPrintAllOpen(false);
    setDateFrom("");
    setDateTo("");
    setCreationDateFrom("");
    setCreationDateTo("");
  };

  useEffect(() => {
    if (!isEditDialogOpen) {
      const fetchDispenses = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}reagents-dispense`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch disposal forms");
          }
          const data = await response.json();

          const mappedDisposal = data.map(
            (disposal: ReagentDispenseSchema) => ({
              ...disposal,
              laboratory: `${disposal.reagent.laboratory.labName}`,
              remainingQuantity: disposal.reagent.quantityAvailable,
            })
          );
          const disposedMaterials = mappedDisposal.filter(
            (disposal: ReagentDispenseValues) =>
              disposal.laboratory.toLowerCase() === labSlug
          );
          setDispenses(disposedMaterials);
          setFilteredDispenses(disposedMaterials);
        } catch (error) {
          console.error("Error fetching forms:", error);
        }
      };

      fetchDispenses();
    }
  }, [labSlug, isEditDialogOpen]);

  const sortMaterials = (
    materials: ReagentDispenseValues[],
    key: keyof ReagentDispenseValues,
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

  const handleSort = (column: keyof ReagentDispenseValues) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = sortMaterials(filteredDispenses, column, newDirection);
    setFilteredDispenses(sorted);
  };

  useEffect(() => {
    const applyFilters = () => {
      const filtered = dispenses.filter((dispense) => {
        const matchesMaterial =
          selectedMaterial.size === 0 || selectedMaterial.has(dispense.name);
        const matchesPersonnel =
          selectedPersonnel.size === 0 ||
          selectedPersonnel.has(dispense.analyst);
        return matchesPersonnel && matchesMaterial;
      });

      setFilteredDispenses(filtered);
      setCurrentPage(1);
    };
    applyFilters();
  }, [selectedPersonnel, selectedMaterial, dispenses]);

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
    setFilteredDispenses(
      dispenses.filter((dispense) => {
        const combinedString = `${dispense.name} ${dispense.analyst} ${dispense.remarks} ${dispense.date}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedMaterials = filteredDispenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filterByDateRange = (
    data: ReagentDispenseValues[],
    dateFrom: string,
    dateTo: string,
    creationDateFrom: string,
    creationDateTo: string
  ) => {
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    const fromCreationDate = creationDateFrom
      ? new Date(creationDateFrom)
      : null;
    const toCreationDate = creationDateTo ? new Date(creationDateTo) : null;

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }
    if (toCreationDate) {
      toCreationDate.setHours(23, 59, 59, 999);
    }

    return data.filter((dispense) => {
      const dispenseDate = new Date(dispense.date);
      const creationDate = new Date(dispense.creationDate);

      const isWithinDateRange =
        (!fromDate || dispenseDate >= fromDate) &&
        (!toDate || dispenseDate <= toDate);
      const isWithinCreationDateRange =
        (!fromCreationDate || creationDate >= fromCreationDate) &&
        (!toCreationDate || creationDate <= toCreationDate);

      return isWithinDateRange && isWithinCreationDateRange;
    });
  };

  const tableHeaders = [
    "ID",
    "Date",
    "Item Name",
    "Total Containers",
    "Lot Number",
    "Quantity Dispensed",
    "Remaining Quantity",
    "Remarks",
    "Analyst",
    "Date Created",
    "Date Updated",
  ];
  const tableData = filterByDateRange(
    dispenses,
    dateFrom,
    dateTo,
    creationDateFrom,
    creationDateTo
  ).map((dispense) => [
    dispense.dispenseId,
    new Date(dispense.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    dispense.name,
    dispense.totalNoContainers,
    dispense.lotNo,
    dispense.qtyDispensed,
    dispense.remainingQuantity,
    dispense.remarks,
    dispense.analyst,
    new Date(dispense.creationDate).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    new Date(dispense.dateUpdated).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ]);

  const singleTableData = selectedDispense
    ? [
        [
          selectedDispense.dispenseId,
          new Date(selectedDispense.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          selectedDispense.name,
          selectedDispense.totalNoContainers,
          selectedDispense.lotNo,
          selectedDispense.qtyDispensed,
          selectedDispense.remainingQuantity,
          selectedDispense.remarks,
          selectedDispense.analyst,
          new Date(selectedDispense.creationDate).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          new Date(selectedDispense.dateUpdated).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ],
      ]
    : [];

  return (
    <div className="p-8">
      <h1 className="text-3xl sm:text-2xl text-center sm:text-left font-semibold text-teal-700 mb-4">
        Reagent Dispense Forms
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
                        <span className="text-black">Analyst</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(dispenses.map((m) => m.analyst))
                        ).map((analyst) => (
                          <label
                            key={analyst}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={analyst}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedPersonnel.has(analyst)}
                              onChange={() => handlePersonnelChange(analyst)}
                            />
                            <span>{analyst}</span>
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
                        {Array.from(new Set(dispenses.map((m) => m.name))).map(
                          (material_name) => (
                            <label
                              key={material_name}
                              className="flex items-center space-x-2 whitespace-nowrap"
                            >
                              <Input
                                type="checkbox"
                                value={material_name}
                                className="text-teal-500 accent-teal-200"
                                checked={selectedMaterial.has(material_name)}
                                onChange={() =>
                                  handleMaterialChange(material_name)
                                }
                              />
                              <span>{material_name}</span>
                            </label>
                          )
                        )}
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
                router.push("/reagents-dispense-form");
              }}
            >
              <FilePlus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Dispense Reagent
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
              <TableHead onClick={() => handleSort("reagentId")}>
                ID{" "}
                {sortColumn === "reagentId" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("date")}>
                Date{" "}
                {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("name")}>
                Item Name{" "}
                {sortColumn === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("totalNoContainers")}>
                Total Containers{" "}
                {sortColumn === "totalNoContainers" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("lotNo")}>
                Lot Number{" "}
                {sortColumn === "lotNo" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("qtyDispensed")}>
                Quantity Dispensed{" "}
                {sortColumn === "qtyDispensed" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("remainingQuantity")}>
                Remaining Quantity{" "}
                {sortColumn === "remainingQuantity" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("remarks")}>
                Remarks{" "}
                {sortColumn === "remarks" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("analyst")}>
                Analyst{" "}
                {sortColumn === "analyst" &&
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
              paginatedMaterials.map((dispense) => (
                <TableRow key={dispense.dispenseId}>
                  <TableCell>{dispense.dispenseId}</TableCell>
                  <TableCell>
                    {new Date(dispense.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>{dispense.name}</TableCell>
                  <TableCell>{dispense.totalNoContainers}</TableCell>
                  <TableCell>{dispense.lotNo}</TableCell>
                  <TableCell>{dispense.qtyDispensed}</TableCell>
                  <TableCell>{dispense.remainingQuantity}</TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {dispense.remarks}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dispense.remarks}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{dispense.analyst}</TableCell>
                  <TableCell>
                    {new Date(dispense.creationDate).toLocaleDateString(
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
                    {new Date(dispense.dateUpdated).toLocaleDateString(
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
                        setSelectedDispense(dispense);
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
                        setSelectedDispense(dispense);
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
                <TableCell colSpan={12} className="text-center text-gray-500">
                  No materials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
      <CustomPagination
        totalItems={filteredDispenses.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-h-4/5 sm:h-4/5 h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Edit className="text-teal-500 size-5 -mt-0.5" />
              Edit Reagent Dispense
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedDispense && (
            <EditReagentDispense
              closeDialog={() => setIsEditDialogOpen(false)}
              dispenseId={selectedDispense.dispenseId}
              date={selectedDispense.date}
              materialId={selectedDispense.reagentId}
              name={selectedDispense.name}
              totalNoContainers={selectedDispense.totalNoContainers}
              lotNo={selectedDispense.lotNo}
              qtyDispensed={selectedDispense.qtyDispensed}
              remainingQuantity={selectedDispense.remainingQuantity}
              remarks={selectedDispense.remarks}
              userId={selectedDispense.userId}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintAllOpen} onOpenChange={handlePrintDialogClose}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <Printer className="text-teal-500 size-5 -mt-0.5" />
              Print Reagent Dispense Report
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
              pdfTitle="Reagent Dispense Report"
              pageSize="long"
              orientation="landscape"
              tableHeaders={tableHeaders}
              tableData={tableData}
              closeDialog={handlePrintDialogClose}
            ></PdfGenerator>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              Print Reagent Dispense Form
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
            {selectedDispense && (
              <PdfForm
                pdfTitle="Reagent Dispense Form"
                pageSize={pageSize}
                orientation={orientation}
                tableHeaders={tableHeaders}
                tableData={singleTableData}
                materialName={selectedDispense.name}
                closeDialog={() => setIsPrintDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReagentDispense;
