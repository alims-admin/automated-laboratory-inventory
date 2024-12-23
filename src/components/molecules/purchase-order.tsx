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
  FolderOpen,
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
import CustomPagination from "../ui/pagination-custom";
import PdfForm from "../templates/pdf-form";
import { PurchaseOrderSchema, PurchaseSchema } from "@/packages/api/inventory";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UserSchema } from "@/packages/api/user";
import { Supplier } from "@/packages/api/lab";
import EditPurchaseOrder from "../dialogs/edit-purchase-order";
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
import PdfGenerator from "../templates/pdf-generator";
import { Separator } from "../ui/separator";
interface PurchaseOrderValues {
  purchaseOrderId: number;
  purchaseOrderNumber: string;
  userId: number;
  userFullName: string;
  user: UserSchema;
  supplierId: number;
  supplierName: string;
  supplier: Supplier;
  date: string;
  shippingCost: number;
  totalPrice: number;
  status: string;
  labId: number;
  laboratory: string;
  tax: number;
  creationDate: string;
  dateUpdated: string;
}

const ITEMS_PER_PAGE = 4;

const PurchaseOrder = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [purchases, setPurchases] = useState<PurchaseOrderValues[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseSchema[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPurchasePage, setCurrentPurchasePage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] =
    useState<PurchaseOrderValues | null>(null);
  const [filteredPurchases, setFilteredPurchases] = useState<
    PurchaseOrderValues[]
  >([]);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPrintAllOpen, setIsPrintAllOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [pageSize, setPageSize] = useState("a4");
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | undefined
  >(undefined);

  const [sortColumn, setSortColumn] = useState<
    keyof PurchaseOrderValues | null
  >(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Set<string>>(
    new Set()
  );
  const [isLaboratoryOpen, setIsLaboratoryOpen] = useState(false);
  const [selectedLaboratory, setSelectedLaboratory] = useState<Set<string>>(
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
            `${process.env.NEXT_PUBLIC_BACKEND_URL}purchase-order`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch purchase orders");
          }
          const data = await response.json();
          const mappedPurchases = data.map((purchase: PurchaseOrderSchema) => ({
            ...purchase,
            userFullName: `${purchase.user.firstName} ${
              purchase.user.middleName ? purchase.user.middleName + " " : ""
            }${purchase.user.lastName}`,
            supplierName: purchase.supplier.companyName ?? "",
            laboratory: purchase.laboratory.labName,
          }));
          const purchases = mappedPurchases.filter(
            (purchase: PurchaseOrderValues) =>
              purchase.laboratory.toLowerCase() === labSlug
          );
          setPurchases(purchases);
          setFilteredPurchases(purchases);
        } catch (error) {
          console.error("Error fetching materials:", error);
        }
      };

      fetchMaterials();
    }
  }, [labSlug, isEditDialogOpen]);

  const fetchPurchasedItems = async (purchaseOrderId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}purchase/order/${purchaseOrderId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch purchase items");
      }
      const data = await response.json();
      const mappedPurchases = data.map((purchase: PurchaseSchema) => ({
        ...purchase,
      }));
      setPurchaseItems(mappedPurchases);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const sortMaterials = (
    materials: PurchaseOrderValues[],
    key: keyof PurchaseOrderValues,
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

  const handleSort = (column: keyof PurchaseOrderValues) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = sortMaterials(filteredPurchases, column, newDirection);
    setFilteredPurchases(sorted);
  };

  useEffect(() => {
    const applyFilters = () => {
      const filtered = purchases.filter((purchase) => {
        const matchesSupplier =
          selectedSupplier.size === 0 ||
          selectedSupplier.has(purchase.supplierName);
        const matchesLaboratory =
          selectedLaboratory.size === 0 ||
          selectedLaboratory.has(purchase.laboratory);
        return matchesSupplier && matchesLaboratory;
      });

      setFilteredPurchases(filtered);
      setCurrentPage(1);
    };
    applyFilters();
  }, [selectedLaboratory, selectedSupplier, purchases]);

  const handleLaboratoryChange = (labName: string) => {
    setSelectedLaboratory((prev) => {
      const updated = new Set(prev);
      if (updated.has(labName)) {
        updated.delete(labName);
      } else {
        updated.add(labName);
      }
      return updated;
    });
  };

  const handleSupplierChange = (supplierName: string) => {
    setSelectedSupplier((prev) => {
      const updated = new Set(prev);
      if (updated.has(supplierName)) {
        updated.delete(supplierName);
      } else {
        updated.add(supplierName);
      }
      return updated;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredPurchases(
      purchases.filter((purchase) => {
        const combinedString = `${purchase.status} ${purchase.laboratory} ${purchase.supplier} ${purchase.userFullName} ${purchase.purchaseOrderNumber}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedMaterials = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginatedPurchase = purchaseItems.slice(
    (currentPurchasePage - 1) * ITEMS_PER_PAGE,
    currentPurchasePage * ITEMS_PER_PAGE
  );

  const handleReturn = async () => {
    if (selectedPurchase) {
      try {
        const bodyData = {
          status: status,
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}purchase-order/${selectedPurchase.purchaseOrderId}`,
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

  const tableHeaders = [
    "PO ID",
    "Purchase Order Number",
    "Personnel",
    "Laboratory",
    "Date",
    "Shipping Cost",
    "Tax",
    "Total Price",
    "Supplier",
    "Status",
    "Date Created",
    "Date Updated",
  ];
  const adjustToDate = (date: string) => {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  };
  const tableData = purchases
    .filter((purchase) => {
      const purchaseDate = new Date(purchase.date);
      const creationDate = new Date(purchase.creationDate);
      const dateFromFilter = dateFrom ? new Date(dateFrom) : null;
      const dateToFilter = dateTo ? adjustToDate(dateTo) : null;
      const creationDateFromFilter = creationDateFrom
        ? new Date(creationDateFrom)
        : null;
      const creationDateToFilter = creationDateTo
        ? adjustToDate(creationDateTo)
        : null;

      const isWithinDateRange =
        (!dateFromFilter || purchaseDate >= dateFromFilter) &&
        (!dateToFilter || purchaseDate <= dateToFilter);

      const isWithinCreationDateRange =
        (!creationDateFromFilter || creationDate >= creationDateFromFilter) &&
        (!creationDateToFilter || creationDate <= creationDateToFilter);

      return isWithinDateRange && isWithinCreationDateRange;
    })
    .map((purchase) => [
      purchase.purchaseOrderId,
      purchase.purchaseOrderNumber,
      purchase.userFullName,
      purchase.laboratory,
      new Date(purchase.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      purchase.shippingCost,
      purchase.tax,
      purchase.totalPrice,
      purchase.supplierName,
      purchase.status,
      new Date(purchase.creationDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      new Date(purchase.dateUpdated).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    ]);

  const singleTableData = selectedPurchase
    ? [
        [
          selectedPurchase.purchaseOrderId,
          selectedPurchase.purchaseOrderNumber,
          selectedPurchase.userFullName,
          selectedPurchase.laboratory,
          new Date(selectedPurchase.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
          selectedPurchase.shippingCost,
          selectedPurchase.tax,
          selectedPurchase.totalPrice,
          selectedPurchase.supplierName,
          selectedPurchase.status,
          new Date(selectedPurchase.creationDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          new Date(selectedPurchase.dateUpdated).toLocaleDateString("en-US", {
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
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl sm:text-2xl text-center sm:text-left font-semibold text-teal-700 mb-4">
        Purchase Order Forms
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
                    open={isSupplierOpen}
                    onOpenChange={setIsSupplierOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Supplier</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {Array.from(
                          new Set(purchases.map((m) => m.supplierName))
                        ).map((supplierName) => (
                          <label
                            key={supplierName}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={supplierName}
                              className="text-teal-500 accent-teal-200"
                              checked={selectedSupplier.has(supplierName)}
                              onChange={() =>
                                handleSupplierChange(supplierName)
                              }
                            />
                            <span>{supplierName}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Collapsible
                    open={isLaboratoryOpen}
                    onOpenChange={setIsLaboratoryOpen}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                        <span className="text-black">Laboratory</span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 transition-all text-sm">
                        {["Pathology", "Immunology", "Microbiology"].map(
                          (labName) => (
                            <label
                              key={labName}
                              className="flex items-center space-x-2 whitespace-nowrap"
                            >
                              <Input
                                type="checkbox"
                                value={labName}
                                className="text-teal-500 accent-teal-200"
                                checked={selectedLaboratory.has(labName)}
                                onChange={() => handleLaboratoryChange(labName)}
                              />
                              <span>{labName}</span>
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
                      setSelectedLaboratory(new Set());
                      setSelectedSupplier(new Set());
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
                router.push("/laboratory-purchase-order");
              }}
            >
              <FilePlus className="w-4 h-4 mr-1" strokeWidth={1.5} />
              <span className="lg:flex md:hidden flex truncate">
                Purchase Materials
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
            <TableHead onClick={() => handleSort("purchaseOrderId")}>
              Purchase Order Number{" "}
              {sortColumn === "purchaseOrderId" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("userFullName")}>
              Personnel{" "}
              {sortColumn === "userFullName" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("laboratory")}>
              Laboratory{" "}
              {sortColumn === "laboratory" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("date")}>
              Date{" "}
              {sortColumn === "date" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("shippingCost")}>
              Shipping Cost{" "}
              {sortColumn === "shippingCost" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("tax")}>
              Tax{" "}
              {sortColumn === "tax" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("totalPrice")}>
              Total Price{" "}
              {sortColumn === "totalPrice" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("supplier")}>
              Supplier{" "}
              {sortColumn === "supplier" &&
                (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("status")}>
              Status{" "}
              {sortColumn === "status" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead
              onClick={() => handleSort("creationDate")}
              className="text-nowrap"
            >
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
            paginatedMaterials.map((purchase) => (
              <TableRow key={purchase.purchaseOrderId}>
                <TableCell>{purchase.purchaseOrderNumber}</TableCell>
                <TableCell>{purchase.userFullName}</TableCell>
                <TableCell>{purchase.laboratory}</TableCell>
                <TableCell>
                  {new Date(purchase.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </TableCell>
                <TableCell>{purchase.shippingCost}</TableCell>
                <TableCell>{purchase.tax}</TableCell>
                <TableCell>{purchase.totalPrice}</TableCell>
                <TableCell>{purchase.supplierName}</TableCell>
                <TableCell>
                  {purchase.status === "Completed" ? (
                    <div className="w-full px-4 py-2 rounded-md bg-green-300 font-semibold text-green-950">
                      Completed
                    </div>
                  ) : (
                    <Select
                      disabled={purchase.status === "Completed"}
                      value={purchase.status}
                      onValueChange={(newStatus) => {
                        setSelectedPurchase(purchase);
                        setStatus(newStatus);
                        setIsReturnDialogOpen(true);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full",
                          purchase.status === "Cancelled"
                            ? "bg-red-300 text-red-950"
                            : purchase.status === "Completed"
                            ? "bg-green-300 text-green-950"
                            : purchase.status === "Submitted"
                            ? "bg-yellow-100 text-yellow-800"
                            : purchase.status === "Procurement Office"
                            ? "bg-blue-300 text-blue-950"
                            : purchase.status === "Accounting Office"
                            ? "bg-purple-300 text-purple-950"
                            : purchase.status === "Delivered"
                            ? "bg-orange-300 text-orange-950"
                            : "bg-emerald-300 text-emerald-950"
                        )}
                      >
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Procurement Office">
                          Procurement Office
                        </SelectItem>
                        <SelectItem value="Accounting Office">
                          Accounting Office
                        </SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(purchase.creationDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  {new Date(purchase.dateUpdated).toLocaleDateString("en-US", {
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
                    className="rounded-md w-full text-emerald-700 hover:text-emerald-900 hover:bg-emerald-200 mb-1 bg-emerald-100"
                    onClick={() => {
                      fetchPurchasedItems(purchase.purchaseOrderId);
                      setSelectedPurchase(purchase);
                      setIsViewOpen(true);
                    }}
                  >
                    <FolderOpen className="w-4 h-4 -mr-1" /> View Items
                  </Button>
                  {purchase.status !== "Completed" &&
                    purchase.status !== "Cancelled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-md text-cyan-600 hover:text-cyan-900 hover:bg-cyan-50"
                        onClick={() => {
                          setSelectedPurchase(purchase);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 -mr-0.5" /> Edit Form
                      </Button>
                    )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      `rounded-md ${
                        purchase.status === "Completed" ||
                        purchase.status === "Cancelled"
                          ? "w-full"
                          : "text-black-600 hover:text-black-900 hover:bg-black-50"
                      }`
                    )}
                    onClick={() => {
                      setSelectedPurchase(purchase);
                      setIsPrintDialogOpen(true);
                    }}
                  >
                    <Printer className="w-4 h-4 -mr-1" /> Print Form
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
      <CustomPagination
        totalItems={filteredPurchases.length}
        itemsPerPage={ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-h-4/5 h-fit max-w-4xl w-full flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 tracking-tight text-teal-900 mt-2">
              <Edit className="text-teal-500 size-5 -mt-0.5" />
              Edit Purchase Order Form
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <EditPurchaseOrder
            purchaseOrderId={selectedPurchase?.purchaseOrderId ?? 0}
            closeDialog={() => setIsEditDialogOpen(false)}
            purchaseOrderNo={selectedPurchase?.purchaseOrderNumber ?? ""}
            date={selectedPurchase?.date ?? ""}
            status={selectedPurchase?.status ?? ""}
            supplierId={selectedPurchase?.supplierId ?? 0}
            supplierName={selectedPurchase?.supplierName ?? ""}
            supplierAddress={selectedPurchase?.supplier.address ?? ""}
            supplierPhoneNo={selectedPurchase?.supplier.phoneNumber ?? ""}
            supplierEmail={selectedPurchase?.supplier.email ?? ""}
            supplierContactPerson={
              selectedPurchase?.supplier.contactPerson ?? ""
            }
            labName={selectedPurchase?.laboratory ?? ""}
            labAddress={selectedPurchase?.user.laboratory.location ?? ""}
            labPhoneNo={selectedPurchase?.user.phoneNumber ?? ""}
            labEmail={selectedPurchase?.user.email ?? ""}
            userId={selectedPurchase?.userId ?? 0}
            itemPurchases={purchaseItems}
            tax={selectedPurchase?.tax ?? 0}
            shippingCost={selectedPurchase?.shippingCost ?? 0}
            totalPrice={selectedPurchase?.totalPrice ?? 0}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="bg-white max-h-4/5 h-fit max-w-2xl flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 tracking-tight text-teal-900 mt-2">
              <FolderOpen className="text-teal-500 size-5 -mt-0.5" />
              View Purchase Items
            </DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div>
              <Table className="overflow-x-auto">
                <TableHeader className="text-center justify-center">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-nowrap">Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPurchase.map((purchaseItem) => (
                    <TableRow key={purchaseItem.purchaseId}>
                      <TableCell>{purchaseItem.purchaseId}</TableCell>
                      <TableCell>{purchaseItem.description}</TableCell>
                      <TableCell>{purchaseItem.qty}</TableCell>
                      <TableCell>{purchaseItem.unitPrice}</TableCell>
                      <TableCell>
                        {new Date(purchaseItem.creationDate).toLocaleDateString(
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
                        {new Date(purchaseItem.dateUpdated).toLocaleDateString(
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                totalItems={purchaseItems.length}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPurchasePage}
                onPageChange={(page) => setCurrentPurchasePage(page)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPrintAllOpen} onOpenChange={handlePrintDialogClose}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              Print Purchase Order Report
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
              pdfTitle="Purchase Order Report"
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
            {selectedPurchase && (
              <PdfForm
                pdfTitle="Purchase Order Form"
                pageSize={pageSize}
                orientation={orientation}
                tableHeaders={tableHeaders}
                tableData={singleTableData}
                materialName={selectedPurchase.purchaseOrderNumber}
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
            Are you sure you want to set the status to {status}?
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

export default PurchaseOrder;
