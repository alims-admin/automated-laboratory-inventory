"use client";
import {
  Search,
  UserRound,
  ShoppingCart,
  Microscope,
  Syringe,
  Dna,
  Box,
  LogOut,
  RotateCw,
  UserPen,
  UserCog,
  Menu,
  Printer,
} from "lucide-react";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "../ui/navigation-menu";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { toast, Toaster } from "sonner";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import ChangePassword from "../dialogs/change-password";
import EditAccount from "../dialogs/edit-user";
import PdfGenerator from "../templates/pdf-generator";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MaterialSchema } from "@/packages/api/inventory";
import { Label } from "../ui/label";

const Navbar = () => {
  const router = useRouter();
  const labSlug = useParams().labSlug;
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const [materials, setMaterials] = useState<MaterialSchema[]>([]);
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape" | undefined
  >(undefined);
  const [isPrintDialogOpen, setisPrintDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState("a4");
  const [query, setQuery] = useState("");
  const [filteredForms, setFilteredForms] = useState<FormData[]>([]);
  const [allForms, setAllForms] = useState<FormData[]>([]);
  const [selectedLab, setSelectedLab] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | undefined
  >(undefined);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  interface FormData {
    id: string;
    name: string;
    path: string;
  }

  useEffect(() => {
    const fetchForms = async () => {
      const data: FormData[] = [
        {
          id: "1",
          name: "Biological Inventory Form",
          path: "/biological-inventory-form",
        },
        {
          id: "2",
          name: "Chemical Inventory Form",
          path: "/chemical-inventory-form",
        },
        {
          id: "3",
          name: "General Supplier Inventory Form",
          path: "/gensupplies-inventory-form",
        },
        {
          id: "4",
          name: "Reagents Inventory Form",
          path: "/reagents-inventory-form",
        },
        {
          id: "5",
          name: "Purchase Order Form",
          path: "/laboratory-purchase-order",
        },
        { id: "6", name: "Borrow Form", path: "/borrow-form" },
        { id: "7", name: "Incident Form", path: "/incident-form" },
        { id: "8", name: "Disposition Form", path: "/disposition-report" },
        {
          id: "9",
          name: "Calibration Log Form",
          path: "/calibration-log-form",
        },
        {
          id: "10",
          name: "Reagents Dispense Form",
          path: "/reagents-dispense-form",
        },
      ];
      setAllForms(data);
    };
    fetchForms();
  }, []);

  useEffect(() => {
    if (query === "") {
      setFilteredForms([]);
    } else {
      setFilteredForms(
        allForms.filter((form) =>
          form.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
  }, [query, allForms]);

  const adjustToDate = (date: string) => {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999); // Set time to 11:59:59pm
    return endDate;
  };

  const fetchStockLevels = async () => {
    try {
      let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}material/all?`;
      if (selectedLab) url += `lab=${selectedLab}&`;
      if (selectedCategory) url += `category=${selectedCategory}&`;
      if (selectedSubcategory) url += `subcategory=${selectedSubcategory}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${adjustToDate(endDate)}&`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch borrow forms");
      }
      const data = await response.json();
      const mappedMaterials = data.map((material: MaterialSchema) => ({
        ...material,
      }));
      setMaterials(mappedMaterials);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const logoutUser = () => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("User is not logged in.");
      return;
    }

    const userId = token;

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}logout?userId=${userId}`, {
      method: "POST",
    })
      .then((response) => {
        if (response.ok) {
          localStorage.removeItem("authToken");
          toast.success("Logged out successfully.");
          router.push("/login");
        } else {
          throw new Error("Failed to log out.");
        }
      })
      .catch((error) => {
        toast.error("Error logging out. Please try again.");
        console.error("Logout error:", error);
      });
  };
  const tableHeaders = [
    "ID",
    "Item Name",
    "Item Code",
    "On Hand",
    "Minimum",
    "Maximum",
    "Status",
    "Date Created",
    "Date Updated",
  ];

  return (
    <div className="w-full max-w-full bg-teal-50 shadow-lg p-2 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center px-2 space-x-2">
        <Image
          src="/images/logo.png"
          alt="Logo"
          className="transition duration-500 hover:scale-110"
          height={40}
          width={40}
        />
        <span className="text-base text-teal-900">ALIMS</span>
      </div>

      <NavigationMenu className="ml-36 hidden lg:flex text-teal-950 justify-center space-x-2 text-sm transition-transform">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(
                `p-2.5 flex hover:text-teal-800 hover:bg-teal-200 transition-all duration-300 ease-out rounded-xl cursor-pointer ${
                  labSlug === "pathology" ? "bg-teal-800 text-white" : ""
                }`
              )}
              onClick={() => router.push("/lab/pathology")}
            >
              <Microscope className="size-5 pr-1" />
              Pathology
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(
                `p-2.5 flex hover:text-teal-800 hover:bg-teal-200 transition-all duration-300 ease-out rounded-xl cursor-pointer ${
                  labSlug === "immunology" ? "bg-teal-800 text-white" : ""
                }`
              )}
              onClick={() => router.push("/lab/immunology")}
            >
              <Syringe className="size-5 pr-1" />
              Immunology
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={cn(
                `p-2.5 flex hover:text-teal-800 hover:bg-teal-200 transition-all duration-300 ease-out rounded-xl cursor-pointer ${
                  labSlug === "microbiology" ? "bg-teal-800 text-white" : ""
                }`
              )}
              onClick={() => router.push("/lab/microbiology")}
            >
              <Dna className="size-5 pr-1" />
              Microbiology
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className="p-2.5 flex hover:text-teal-800 hover:bg-teal-100  rounded-xl transition-all duration-300 ease-out cursor-pointer"
              onClick={() => router.push("/laboratory-purchase-order")}
            >
              <ShoppingCart className="size-5 pr-1" />
              Purchase Order
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              onClick={() => {
                fetchStockLevels();
                setisPrintDialogOpen(true);
              }}
              className="p-2.5 flex hover:text-teal-800 hover:bg-teal-100  rounded-xl transition-all duration-300 ease-out cursor-pointer"
            >
              <Box className="size-5 pr-1" />
              Stock Level
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex mr-1">
        <div className="relative hidden md:flex flex-col items-center max-w-xs">
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-5 pr-4 bg-white rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              className="absolute right-2 top-2 bg-teal-500 text-white p-1 rounded-full hover:bg-teal-600 transition"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          {query && (
            <div className="absolute top-full mt-2 z-10 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
              {filteredForms.length > 0 ? (
                filteredForms.map((form) => (
                  <div
                    key={form.id}
                    className="p-2 cursor-pointer hover:bg-teal-100 transition"
                    onClick={() => router.push(form.path)}
                  >
                    {form.name}
                  </div>
                ))
              ) : (
                <div className="p-2 text-gray-500">No results found</div>
              )}
            </div>
          )}
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger className="lg:hidden p-2 text-teal-900 rounded-full transition">
            <Menu className="w-6 h-6" />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="right"
            sideOffset={10}
            className="bg-white shadow-lg rounded-md p-4 lg:hidden"
          >
            <div className="relative p-4 md:hidden flex">
              <Input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-5 pr-10 bg-white rounded-full shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              {query && (
                <div className="absolute top-full z-10 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                  {filteredForms.length > 0 ? (
                    filteredForms.map((form) => (
                      <div
                        key={form.id}
                        className="p-2 cursor-pointer hover:bg-teal-100 transition"
                        onClick={() => router.push(form.path)}
                      >
                        {form.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-gray-500">No results found</div>
                  )}
                </div>
              )}
              <button
                className="absolute top-1/2 transform -translate-y-1/2 right-5 bg-teal-500 text-white p-2 rounded-full hover:bg-teal-600 transition"
                aria-label="Search"
                onClick={() => setIsOpen(false)}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col space-y-2 xs:border-t xs:border-teal-500 cursor-pointer">
              <a
                className={cn(
                  "flex items-center gap-2 tracking-tight text-teal-900 mt-2 px-4 py-2 hover:bg-teal-200 rounded-md transition-colors ease-out duration-300",
                  labSlug === "pathology"
                    ? "bg-teal-800 text-white hover:text-teal-900"
                    : ""
                )}
                onClick={() => {
                  router.push("/lab/pathology");
                  setIsOpen(false);
                }}
              >
                <Microscope className="w-5 h-5" />
                Pathology
              </a>
              <a
                className={cn(
                  "flex items-center gap-2 tracking-tight text-teal-900 mt-2 px-4 py-2 hover:bg-teal-200 rounded-md  transition-colors ease-out duration-300",
                  labSlug === "immunology"
                    ? "bg-teal-800 text-white hover:text-teal-900"
                    : ""
                )}
                onClick={() => {
                  router.push("/lab/immunology");
                  setIsOpen(false);
                }}
              >
                <Syringe className="w-5 h-5" />
                Immunology
              </a>
              <a
                className={cn(
                  "flex items-center gap-2 tracking-tight text-teal-900 mt-2 px-4 py-2 hover:bg-teal-200 rounded-md  transition-colors ease-out duration-300",
                  labSlug === "microbiology"
                    ? "bg-teal-800 text-white hover:text-teal-900"
                    : ""
                )}
                onClick={() => {
                  router.push("/lab/microbiology");
                  setIsOpen(false);
                }}
              >
                <Dna className="w-5 h-5" />
                Microbiology
              </a>
              <a
                className="flex items-center gap-2 tracking-tight text-teal-900 mt-2 px-4 py-2 hover:bg-teal-100 rounded-md  transition-colors ease-out duration-300"
                onClick={() => router.push("/laboratory-purchase-order")}
              >
                <ShoppingCart className="w-5 h-5" />
                Purchase Order
              </a>
              <a
                className="flex items-center gap-2 tracking-tight text-teal-900 mt-2 px-4 py-2 hover:bg-gray-100 rounded-md transition"
                onClick={() => {
                  setisPrintDialogOpen(true);
                  setIsOpen(false);
                }}
              >
                <Box className="w-5 h-5" />
                Stock Level
              </a>
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger className="flex items-center text-white p-0.5 transition">
            <UserRound className="w-6 h-6 text-teal-900 transition hover:scale-110" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2 shadow-lg">
            <a
              onClick={() => {
                setShowEditDialog(true);
              }}
              className="flex items-center gap-2 tracking-tight text-gray-700 mt-2 px-4 py-2 hover:bg-gray-100 rounded-md transition"
            >
              <UserPen className="size-5 -mt-0.5" />
              Edit Profile
            </a>
            <a
              onClick={() => {
                setShowResetDialog(true);
              }}
              className="flex items-center gap-2 tracking-tight text-gray-700 mt-2 px-4 py-2 hover:bg-gray-100 rounded-md transition"
            >
              <RotateCw className="size-5 -mt-0.5" />
              Reset Password
            </a>
            {(userRole === "admin" || userRole === "superadmin") && (
              <a
                onClick={() => router.push("/admin-dashboard")}
                className="flex items-center gap-2 tracking-tight text-gray-700 mt-2 px-4 py-2 hover:bg-gray-100 rounded-md transition"
              >
                <UserCog className="size-5 -mt-0.5" />
                Manage Users
              </a>
            )}
            <a
              onClick={() => setIsLogoutDialogOpen(true)}
              className="flex items-center gap-2 tracking-tight text-gray-700 mt-2 px-4 py-2 hover:bg-gray-100 rounded-md transition"
            >
              <LogOut className="size-5 -mt-0.5" />
              Logout
            </a>
          </PopoverContent>
        </Popover>

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 tracking-tight text-teal-900 mt-2">
                <RotateCw className="text-teal-900 size-5 -mt-0.5" />
                Reset Password
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <ChangePassword closeDialog={() => setShowResetDialog(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 tracking-tight text-teal-900 mt-2">
                <UserPen className="text-teal-900 size-5 -mt-0.5" />
                Edit Profile
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <EditAccount closeDialog={() => setShowEditDialog(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 tracking-tight">
                <LogOut className="text-red-500 size-5 -mt-0.5" />
                Confirm Logout
              </DialogTitle>
              <DialogDescription />
            </DialogHeader>
            <p className="text-left pt-2 text-sm">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="ghost"
                className="bg-gray-100"
                onClick={() => setIsLogoutDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsLogoutDialogOpen(false);
                  logoutUser();
                }}
              >
                Confirm
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={isPrintDialogOpen}
          onOpenChange={(open) => {
            setisPrintDialogOpen(open);
            if (!open) {
              setSelectedLab(undefined);
              setSelectedCategory(undefined);
              setSelectedSubcategory(undefined);
              setStartDate(undefined);
              setEndDate(undefined);
              setPageSize("a4");
              setOrientation(undefined);
            }
          }}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 tracking-tight">
                <Printer className="text-teal-500 size-5 -mt-0.5" />
                Print Stock Level Report
              </DialogTitle>
            </DialogHeader>
            <DialogDescription />
            <div className="overflow-y-auto max-h-4/5">
              <p className="text-left pt-2 text-base mb-1">
                Select filters for the report:
              </p>
              <div className="flex flex-col gap-3 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex justify-between items-center"
                    >
                      <span
                        className={selectedLab ? "text-black" : "text-gray-500"}
                      >
                        {selectedLab ?? "Select Laboratory"}
                      </span>
                      <span className="ml-auto">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {["Pathology", "Immunology", "Microbiology"].map((lab) => (
                      <DropdownMenuCheckboxItem
                        key={lab}
                        checked={selectedLab === lab}
                        onCheckedChange={(checked) =>
                          setSelectedLab(checked ? lab : undefined)
                        }
                      >
                        {lab}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex justify-between items-center"
                    >
                      <span
                        className={
                          selectedCategory ? "text-black" : "text-gray-500"
                        }
                      >
                        {selectedCategory ?? "Select Category"}
                      </span>
                      <span className="ml-auto">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Array.from(
                      new Set(
                        materials.map((material) => material.category.shortName)
                      )
                    ).map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={selectedCategory === category}
                        onCheckedChange={(checked) => {
                          setSelectedCategory(checked ? category : undefined);
                          setSelectedSubcategory(undefined);
                        }}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex justify-between items-center"
                    >
                      <span
                        className={
                          selectedSubcategory ? "text-black" : "text-gray-500"
                        }
                      >
                        {selectedSubcategory ?? "Select Subcategory"}
                      </span>
                      <span className="ml-auto">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Array.from(
                      new Set(
                        materials
                          .filter(
                            (material) =>
                              material.category.shortName === selectedCategory
                          )
                          .map((material) => material.category.subcategory1)
                      )
                    ).map((subcategory) => (
                      <DropdownMenuCheckboxItem
                        key={subcategory}
                        checked={selectedSubcategory === subcategory}
                        onCheckedChange={(checked) =>
                          setSelectedSubcategory(
                            checked ? subcategory : undefined
                          )
                        }
                      >
                        {subcategory}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-left pt-2 text-base mb-1">
                      Start Date
                    </Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="pl-4 w-full justify-stretch hover:bg-gray-100"
                    />
                  </div>
                  <div>
                    <Label className="text-left pt-2 text-base mb-1">
                      End Date
                    </Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full justify-stretch hover:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
              <p className="text-left text-base mb-1">
                Select page size for the report:
              </p>
              <div className="flex flex-col gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full flex justify-between items-center"
                    >
                      <span
                        className={pageSize ? "text-black" : "text-gray-500"}
                      >
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
                      {
                        label: "Short (Letter, 215.9 x 279.4 mm)",
                        value: "short",
                      },
                      {
                        label: "Long (Legal, 215.9 x 355.6 mm)",
                        value: "long",
                      },
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
              <p className="text-left pt-4 text-base mb-1">
                Select orientation for the report:
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
                          setOrientation(checked ? option.value : undefined)
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
                  onClick={() => setisPrintDialogOpen(false)}
                >
                  Cancel
                </Button>
                <PdfGenerator
                  pdfTitle="Stock Level Report"
                  pageSize={pageSize}
                  orientation={orientation}
                  tableHeaders={tableHeaders}
                  tableData={materials
                    .filter((material) => {
                      if (
                        selectedLab &&
                        material.laboratory.labName !== selectedLab
                      )
                        return false;
                      if (
                        selectedCategory &&
                        material.category.shortName !== selectedCategory
                      )
                        return false;
                      if (
                        selectedSubcategory &&
                        material.category.subcategory1 !== selectedSubcategory
                      )
                        return false;
                      if (
                        startDate &&
                        new Date(material.createdAt ?? "") < new Date(startDate)
                      )
                        return false;
                      if (
                        endDate &&
                        new Date(material.createdAt ?? "") >
                          adjustToDate(endDate)
                      )
                        return false;
                      return true;
                    })
                    .map((material) => [
                      material.materialId ?? "",
                      material.itemName ?? "",
                      material.itemCode ?? "",
                      material.quantityAvailable ?? 0,
                      material.reorderThreshold ?? 0,
                      material.maxThreshold ?? 0,
                      material.quantityAvailable === 0
                        ? "Critical Stockout"
                        : (material.quantityAvailable ?? 0) <
                          (material.reorderThreshold ?? 0)
                        ? "Below Reorder Level"
                        : (material.quantityAvailable ?? 0) <
                          (material.maxThreshold ?? 0)
                        ? "Sufficient"
                        : "Maximum Threshold",
                      material.createdAt
                        ? new Date(material.createdAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A",
                      material.updatedAt
                        ? new Date(material.updatedAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "N/A",
                    ])}
                  closeDialog={() => setisPrintDialogOpen(false)}
                ></PdfGenerator>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Toaster />
      </div>
    </div>
  );
};

export default Navbar;
