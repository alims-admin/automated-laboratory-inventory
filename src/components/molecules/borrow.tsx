import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
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
  SquarePen,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import CustomPagination from "../ui/pagination-custom";
import { BorrowSchema } from "@/packages/api/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import EditBorrow from "../dialogs/borrow-edit";
import PdfGenerator from "../templates/pdf-generator";
import PdfForm from "../templates/pdf-form";
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
import { Separator } from "@/components/ui/separator";

interface Borrow {
  borrowId: number;
  userId: number;
  user: string;
  materialId: number;
  material: { itemName: string; itemCode: string; quantityAvailable: number };
  dateBorrowed: string;
  detailsOfBorrowed: string;
  equipment: string;
  qty: number;
  unit: string;
  borrowerDetail: string;
  department: string;
  timeBorrowed: string;
  dateReturned: string;
  timeReturned: string;
  remarks: string;
  damageMaterials: string;
  status: string;
  creationDate: string;
  dateUpdated: string;
}

const ITEMS_PER_PAGE = 4;

const Borrow = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState<Borrow | null>(null);
  const [filteredBorrows, setFilteredBorrows] = useState<Borrow[]>([]);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | undefined
  >(undefined);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    new Set()
  );
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Set<string>>(
    new Set()
  );
  const [dateBorrowedFrom, setDateBorrowedFrom] = useState("");
  const [dateBorrowedTo, setDateBorrowedTo] = useState("");
  const [dateReturnedFrom, setDateReturnedFrom] = useState("");
  const [dateReturnedTo, setDateReturnedTo] = useState("");
  const [creationDateFrom, setCreationDateFrom] = useState("");
  const [creationDateTo, setCreationDateTo] = useState("");

  useEffect(() => {
    if (!isEditDialogOpen) {
      const fetchMaterials = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}borrow`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch borrow forms");
          }
          const data = await response.json();
          const borrowedMaterials = data.filter(
            (borrow: Borrow) => borrow.department.toLowerCase() === labSlug
          );

          const mappedBorrows = borrowedMaterials.map(
            (borrow: BorrowSchema) => ({
              ...borrow,
              user: `${borrow.user.firstName} ${
                borrow.user.middleName ? borrow.user.middleName + " " : ""
              }${borrow.user.lastName}`,
            })
          );
          setBorrows(mappedBorrows);
          setFilteredBorrows(mappedBorrows);
        } catch (error) {
          console.error("Error fetching materials:", error);
        }
      };

      fetchMaterials();
    }
  }, [labSlug, isEditDialogOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredBorrows(
      borrows.filter((borrow) => {
        const combinedString = `${borrow.status} ${borrow.material.itemName} ${borrow.user}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedMaterials = filteredBorrows.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const tableHeaders = [
    "ID",
    "Item Name",
    "Item Code",
    "Quantity Borrowed",
    "Borrower",
    "Borrower Details",
    "Department",
    "Date Borrowed",
    "Time Borrowed",
    "Date Returned",
    "Time Returned",
    "Remarks",
    "Damage Materials",
    "Status",
    "Date Created",
    "Date Updated",
  ];
  const tableData = borrows.map((borrow) => [
    borrow.materialId,
    borrow.material.itemName,
    borrow.material.itemCode,
    borrow.qty,
    borrow.user,
    borrow.borrowerDetail,
    borrow.department,
    new Date(borrow.dateBorrowed).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    new Date(`1970-01-01T${borrow.timeBorrowed}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    new Date(borrow.dateReturned).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    new Date(`1970-01-01T${borrow.timeReturned}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    borrow.remarks,
    borrow.damageMaterials,
    borrow.status,
    new Date(borrow.creationDate).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    new Date(borrow.dateUpdated).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
  ]);

  const singleTableData = selectedBorrow
    ? [
        [
          selectedBorrow.materialId,
          selectedBorrow.material.itemName,
          selectedBorrow.material.itemCode,
          selectedBorrow.qty,
          selectedBorrow.user,
          selectedBorrow.borrowerDetail,
          selectedBorrow.department,
          new Date(selectedBorrow.dateBorrowed).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          new Date(
            `1970-01-01T${selectedBorrow.timeBorrowed}`
          ).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          new Date(selectedBorrow.dateReturned).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          new Date(
            `1970-01-01T${selectedBorrow.timeReturned}`
          ).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          selectedBorrow.remarks,
          selectedBorrow.damageMaterials,
          selectedBorrow.status,
          new Date(selectedBorrow.creationDate).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          new Date(selectedBorrow.dateUpdated).toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
        ],
      ]
    : [];

  const sortMaterials = (
    materials: Borrow[],
    key: keyof Borrow,
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

  const handleSort = (column: keyof Borrow) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column as keyof Borrow);
    setSortDirection(newDirection);

    const sorted = sortMaterials(filteredBorrows, column, newDirection);
    setFilteredBorrows(sorted);
  };
  useEffect(() => {
    const applyFilters = () => {
      const filtered = borrows.filter((borrow) => {
        const matchesEquipment =
          selectedEquipment.size === 0 ||
          selectedEquipment.has(borrow.equipment);
        const matchesDepartment =
          selectedDepartment.size === 0 ||
          selectedDepartment.has(borrow.department);
        const matchesStatus =
          selectedStatus.size === 0 || selectedStatus.has(borrow.status);

        return matchesEquipment && matchesDepartment && matchesStatus;
      });

      setFilteredBorrows(filtered);
      setCurrentPage(1);
    };
    applyFilters();
  }, [selectedEquipment, selectedDepartment, selectedStatus, borrows]);

  const handleEquipmentChange = (equipment: string) => {
    setSelectedEquipment((prev) => {
      const updated = new Set(prev);
      if (updated.has(equipment)) {
        updated.delete(equipment);
      } else {
        updated.add(equipment);
      }
      return updated;
    });
  };

  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment((prev) => {
      const updated = new Set(prev);
      if (updated.has(department)) {
        updated.delete(department);
      } else {
        updated.add(department);
      }
      return updated;
    });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const handleReturn = async () => {
    if (selectedBorrow) {
      try {
        const currentDate = new Date();
        const dateString = currentDate.toISOString().split("T")[0];
        const timeString = currentDate.toTimeString().split(" ")[0];
        const bodyData = {
          status: status,
          dateReturned:
            status === "Returned" ? dateString : selectedBorrow.dateReturned,
          timeReturned:
            status === "Returned" ? timeString : selectedBorrow.timeReturned,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}borrow/${selectedBorrow.borrowId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
          }
        );

        if (response.ok) {
          toast.success("Status updated successfully!");
          window.location.reload();
        } else {
          throw new Error("Failed to change status");
        }
      } catch (error) {
        toast.error("Failed to update status");
      }
    }
  };

  const adjustToDate = (date: string) => {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999); // Set time to 11:59:59pm
    return endDate;
  };

  const filterTableData = () => {
    return tableData.filter((row) => {
      const dateBorrowed = new Date(row[7]);
      const dateReturned = new Date(row[10]);
      const creationDate = new Date(row[14]);

      const isDateBorrowedInRange =
        (!dateBorrowedFrom || dateBorrowed >= new Date(dateBorrowedFrom)) &&
        (!dateBorrowedTo || dateBorrowed <= adjustToDate(dateBorrowedTo));
      const isDateReturnedInRange =
        (!dateReturnedFrom || dateReturned >= new Date(dateReturnedFrom)) &&
        (!dateReturnedTo || dateReturned <= adjustToDate(dateReturnedTo));
      const isCreationDateInRange =
        (!creationDateFrom || creationDate >= new Date(creationDateFrom)) &&
        (!creationDateTo || creationDate <= adjustToDate(creationDateTo));

      return (
        isDateBorrowedInRange && isDateReturnedInRange && isCreationDateInRange
      );
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl sm:text-2xl text-center sm:text-left font-semibold text-teal-700 mb-4">
        Borrow Forms
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
                    open={isEquipmentOpen}
                    onOpenChange={setIsEquipmentOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Equipment</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(borrows.map((m) => m.equipment))
                        ).map((equipment) => (
                          <label
                            key={equipment}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={equipment}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedEquipment.has(equipment)}
                              onChange={() => handleEquipmentChange(equipment)}
                            />
                            <span>{equipment}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible
                    open={isDepartmentOpen}
                    onOpenChange={setIsDepartmentOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Department</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {["Pathology", "Immunology", "Microbiology"].map(
                          (department) => (
                            <label
                              key={department}
                              className="flex items-center space-x-2 whitespace-nowrap"
                            >
                              <Input
                                type="checkbox"
                                value={department}
                                className="text-teal-500 accent-teal-200"
                                checked={selectedDepartment.has(department)}
                                onChange={() =>
                                  handleDepartmentChange(department)
                                }
                              />
                              <span>{department}</span>
                            </label>
                          )
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible
                    open={isStatusOpen}
                    onOpenChange={setIsStatusOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Status</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {["Borrowed", "Returned"].map((status) => (
                          <label
                            key={status}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={status}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedStatus.has(status)}
                              onChange={() => handleStatusChange(status)}
                            />
                            <span>{status}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Button
                    variant="outline"
                    className="mt-2 w-full sticky bottom-0 bg-white hover:bg-gray-200"
                    onClick={() => {
                      setSelectedStatus(new Set());
                      setSelectedDepartment(new Set());
                      setSelectedEquipment(new Set());
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
                router.push("/borrow-form");
              }}
            >
              <FilePlus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Borrow Material
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
              <TableHead onClick={() => handleSort("borrowId")}>
                ID{" "}
                {sortColumn === "borrowId" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("material")}>
                Item Name{" "}
                {sortColumn === "material.itemName" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("material")}>
                Item Code{" "}
                {sortColumn === "material.itemCode" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("qty")}>
                Quantity Borrowed{" "}
                {sortColumn === "qty" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("user")}>
                Borrower{" "}
                {sortColumn === "user" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("borrowerDetail")}>
                Borrower Details{" "}
                {sortColumn === "borrowerDetail" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("department")}>
                Department{" "}
                {sortColumn === "department" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("dateBorrowed")}>
                Date Borrowed{" "}
                {sortColumn === "dateBorrowed" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("timeBorrowed")}>
                Time Borrowed{" "}
                {sortColumn === "timeBorrowed" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("dateReturned")}>
                Date Returned{" "}
                {sortColumn === "dateReturned" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("timeReturned")}>
                Time Returned{" "}
                {sortColumn === "timeReturned" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("remarks")}>
                Remarks{" "}
                {sortColumn === "remarks" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("damageMaterials")}>
                Damage Materials{" "}
                {sortColumn === "damageMaterials" &&
                  (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead onClick={() => handleSort("status")}>
                Status{" "}
                {sortColumn === "status" &&
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
              paginatedMaterials.map((borrow) => (
                <TableRow key={borrow.borrowId}>
                  <TableCell>{borrow.borrowId}</TableCell>
                  <TableCell>{borrow.material.itemName}</TableCell>
                  <TableCell>{borrow.material.itemCode}</TableCell>
                  <TableCell>{borrow.qty}</TableCell>
                  <TableCell>{borrow.user}</TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {borrow.borrowerDetail}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{borrow.borrowerDetail}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{borrow.department}</TableCell>
                  <TableCell>
                    {new Date(borrow.dateBorrowed).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      `1970-01-01T${borrow.timeBorrowed}`
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(borrow.dateReturned).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(
                      `1970-01-01T${borrow.timeReturned}`
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {borrow.remarks}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{borrow.remarks}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="relative max-w-8 truncate">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer truncate">
                          {borrow.damageMaterials}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{borrow.damageMaterials}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {borrow.status === "Returned" ? (
                      <div className="w-full px-4 py-2 rounded-md bg-green-300 font-semibold text-green-950">
                        Returned
                      </div>
                    ) : (
                      <Select
                        disabled={borrow.status === "Returned"}
                        value={borrow.status}
                        onValueChange={(newStatus) => {
                          setSelectedBorrow(borrow);
                          setStatus(newStatus);
                          setIsReturnDialogOpen(true);
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full",
                            borrow.status === "Borrowed"
                              ? "bg-red-300 text-red-950"
                              : "bg-emerald-300 text-emerald-950"
                          )}
                        >
                          <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Borrowed">Borrowed</SelectItem>
                          <SelectItem value="Returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(borrow.creationDate).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(borrow.dateUpdated).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    {borrow.status !== "Returned" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-cyan-600 hover:text-cyan-900 hover:bg-emerald-50"
                        onClick={() => {
                          setSelectedBorrow(borrow);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 -mr-0.5" /> Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-md text-black-600 hover:text-black-900 hover:bg-black-50"
                      onClick={() => {
                        setSelectedBorrow(borrow);
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
                <TableCell colSpan={17} className="text-center text-gray-500">
                  No materials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
      <CustomPagination
        totalItems={filteredBorrows.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-h-4/5 h-fit max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 tracking-tight text-teal-900 mt-2">
              <Edit className="text-teal-500 size-5 -mt-0.5" />
              Edit Borrow Form
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedBorrow && (
            <EditBorrow
              closeDialog={() => setIsEditDialogOpen(false)}
              borrowId={selectedBorrow.borrowId}
              dateBorrowed={selectedBorrow.dateBorrowed}
              materialId={selectedBorrow.materialId}
              detailsOfBorrowed={selectedBorrow.detailsOfBorrowed}
              qty={selectedBorrow.qty}
              unit={selectedBorrow.unit}
              userId={selectedBorrow.userId}
              borrowerDetail={selectedBorrow.borrowerDetail}
              department={selectedBorrow.department}
              timeBorrowed={selectedBorrow.timeBorrowed}
              dateReturned={selectedBorrow.dateReturned}
              timeReturned={selectedBorrow.timeReturned}
              remarks={selectedBorrow.remarks}
              damageMaterials={selectedBorrow.damageMaterials}
              status={selectedBorrow.status}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintAllOpen} onOpenChange={setIsPrintAllOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              Print Borrow Report
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Date Borrowed From:</label>
              <Input
                type="date"
                value={dateBorrowedFrom}
                onChange={(e) => setDateBorrowedFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Date Borrowed To:</label>
              <Input
                type="date"
                value={dateBorrowedTo}
                onChange={(e) => setDateBorrowedTo(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 text-sm md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label>Date Returned From:</label>
              <Input
                type="date"
                value={dateReturnedFrom}
                onChange={(e) => setDateReturnedFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label>Date Returned To:</label>
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
              onClick={() => setIsPrintAllOpen(false)}
            >
              Cancel
            </Button>
            <PdfGenerator
              pdfTitle="Borrow Forms Report"
              pageSize="long"
              orientation="landscape"
              tableHeaders={tableHeaders}
              tableData={filterTableData()}
              closeDialog={() => setIsPrintAllOpen(false)}
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
            {selectedBorrow && (
              <PdfForm
                pdfTitle="Borrow Form"
                pageSize={pageSize}
                orientation={orientation}
                tableHeaders={tableHeaders}
                tableData={singleTableData}
                materialName={selectedBorrow.material.itemName}
                closeDialog={() => setIsPrintDialogOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <SquarePen className="text-emerald-600 size-5 -mt-0.5" />
              Change Status
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <p className="text-left pt-2 text-sm">
            Are you sure this item has been returned?
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={() => setIsReturnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsReturnDialogOpen(false);
                handleReturn();
              }}
              className="bg-emerald-500 hover:bg-emerald-700 text-white justify-center transition-colors duration-300 ease-in-out"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Borrow;
