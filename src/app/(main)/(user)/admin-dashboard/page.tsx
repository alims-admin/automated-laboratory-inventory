"use client";
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
  Trash,
  Grid,
  List,
  Search,
  TriangleAlert,
  UserPlus,
  UserPen,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import CreateAccount from "@/components/dialogs/create-account";
import { userSchema, UserSchema } from "@/packages/api/user";
import { z } from "zod";
import { useRouter } from "next/navigation";
import CustomPagination from "@/components/ui/pagination-custom";
import EditAccount from "@/components/dialogs/edit-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface MappedUser {
  userId: number;
  lastName: string;
  firstName: string;
  middleName: string | null;
  designation: string;
  laboratory: string;
  labId: number;
  email: string | null;
  username: string;
  status: string;
  phoneNumber: string;
}

const ITEMS_PER_PAGE = 4;

const AdminView = () => {
  const [users, setUsers] = useState<MappedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<MappedUser[]>([]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MappedUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof MappedUser | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );
  const router = useRouter();
  const [selectedDesignation, setSelectedDesignation] = useState<Set<string>>(
    new Set()
  );
  const [selectedLab, setSelectedLab] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState<Set<string>>(new Set());
  const [isDesignationOpen, setIsDesignationOpen] = useState(false);
  const [isLaboratoryOpen, setIsLaboratoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");

    if (userRole !== "admin" && userRole !== "superadmin") {
      router.push("/lab/pathology");
    }
  }, [router]);

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

        const parsedData = z.array(userSchema).parse(data);
        const userRole = localStorage.getItem("userRole");
        const filteredData =
          userRole === "admin"
            ? parsedData.filter(
                (user) =>
                  user.designation !== "admin" &&
                  user.designation !== "superadmin"
              )
            : parsedData;
        const sortedData = filteredData.sort((a, b) =>
          a.lastName.localeCompare(b.lastName)
        );

        const mappedUsers: MappedUser[] = sortedData.map((user) => ({
          userId: user.userId,
          lastName: user.lastName,
          firstName: user.firstName,
          middleName: user.middleName ?? "",
          designation: user.designation,
          laboratory: user.laboratory.labName,
          labId: user.labId,
          email: user.email ?? "",
          username: user.username,
          status: user.status,
          phoneNumber: user.phoneNumber,
        }));

        setUsers(mappedUsers);
        setFilteredUsers(mappedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchAllUsers();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      const filtered = users.filter((user) => {
        const matchesDesignation =
          selectedDesignation.size === 0 ||
          selectedDesignation.has(user.designation);
        const matchesLab =
          selectedLab.size === 0 || selectedLab.has(user.laboratory);
        const matchesStatus =
          selectedStatus.size === 0 || selectedStatus.has(user.status);

        return matchesDesignation && matchesLab && matchesStatus;
      });

      setFilteredUsers(filtered);
      setCurrentPage(1);
    };
    applyFilters();
  }, [selectedDesignation, selectedLab, selectedStatus, users]);

  const handleDesignationChange = (value: string) => {
    setSelectedDesignation((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  const handleLabChange = (value: string) => {
    setSelectedLab((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  const sortUsers = (
    users: MappedUser[],
    key: keyof MappedUser,
    order: "asc" | "desc"
  ) => {
    return [...users].sort((a, b) => {
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

  const handleSort = (column: keyof MappedUser) => {
    const newDirection =
      sortColumn === column && sortDirection === "asc" ? "desc" : "asc";

    setSortColumn(column);
    setSortDirection(newDirection);

    const sorted = sortUsers(filteredUsers, column, newDirection);
    setFilteredUsers(sorted);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredUsers(
      users.filter((user) => {
        const combinedString = `${user.firstName} ${user.lastName} ${user.middleName}  ${user.laboratory} ${user.designation} ${user.status}`;
        return combinedString.toLowerCase().includes(query);
      })
    );
    setCurrentPage(1);
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const handleViewModeChange = (view: string) => {
    setViewMode(view);
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}update-user/${selectedUser.userId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "Deleted",
            }),
          }
        );

        if (response.ok) {
          toast.success("User Deleted successfully!");
          window.location.reload();
        } else {
          throw new Error("Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Failed to delete user");
      }
    }
  };

  const handleEditStatus = async (currentUserId: number, status: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}update-user/${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: status,
          }),
        }
      );
      if (response.ok) {
        toast.success("Account status changed successful!");
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Account update failed!");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="p-4 sm:p-8 md:p-12 w-full min-h-screen bg-white">
      <h1 className="text-lg sm:text-xl font-bold py-2 tracking-tight mb-4 text-teal-900 justify-center hidden sm:flex">
        MANAGE USERS
      </h1>
      <div className="flex sm:flex-row flex-col-reverse sm:justify-between items-end sm:items-center w-full mb-4 space-y-4 sm:space-y-0">
        <div className="flex flex-row w-full sm:w-11/12 md:w-3/4 justify-between sm:justify-start space-x-2">
          <div className="relative w-full">
            <Input
              placeholder="Search for a user"
              value={search}
              onChange={handleSearch}
              className="w-full pr-10 rounded-lg"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Search className="size-5 text-gray-500" />
            </span>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  `bg-teal-500 text-white w-auto justify-center rounded-lg hover:bg-teal-700 transition-colors duration-300 ease-in-out mx-6 flex items-center`
                )}
              >
                <Filter /> <span className="lg:flex hidden">Filter</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col p-2 w-auto max-w-sm sm:max-w-lg  max-h-96 overflow-y-auto overflow-x-hidden">
              <div className="flex flex-col items-start">
                <Collapsible
                  open={isDesignationOpen}
                  onOpenChange={setIsDesignationOpen}
                  className="w-auto"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-48 px-2 justify-start text-black text-sm font-semibold hover:bg-teal-100"
                    >
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="text-black">Designation</span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 transition-all text-sm">
                      {[
                        "Admin",
                        "Lab Manager",
                        "Medical Technologist",
                        "Researcher",
                        "Student",
                        "Technician",
                      ].map((designation) => (
                        <label
                          key={designation}
                          className="flex items-center space-x-2 whitespace-nowrap"
                        >
                          <Input
                            type="checkbox"
                            value={designation}
                            className="text-teal-500 accent-teal-200"
                            checked={selectedDesignation.has(designation)}
                            onChange={() =>
                              handleDesignationChange(designation)
                            }
                          />
                          <span>{designation}</span>
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
                        (lab) => (
                          <label
                            key={lab}
                            className="flex items-center space-x-2 whitespace-nowrap"
                          >
                            <Input
                              type="checkbox"
                              value={lab}
                              checked={selectedLab.has(lab)}
                              className="text-teal-500 accent-teal-200"
                              onChange={() => handleLabChange(lab)}
                            />
                            <span>{lab}</span>
                          </label>
                        )
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible open={isStatusOpen} onOpenChange={setIsStatusOpen}>
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
                      {[
                        "Active",
                        "Inactive",
                        "Deleted",
                        "Unverified Email",
                        "Unapproved Account",
                      ].map((status) => (
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
                    setSelectedDesignation(new Set());
                    setSelectedLab(new Set());
                    setSelectedStatus(new Set());
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            className={cn(
              `bg-teal-500 text-white w-auto justify-center rounded-lg hover:bg-teal-700 transition-colors duration-300 ease-in-out sm:mx-2 ${
                viewMode === "card" ? "hidden" : ""
              }`
            )}
            onClick={() => {
              setIsCreateDialogOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 md:mr-1" strokeWidth={1.5} />
            <span className="lg:flex hidden">Add User</span>
          </Button>
        </div>

        <div className="w-full flex justify-between sm:justify-end">
          <h1 className="ml-1 text-lg sm:text-xl w-3/4 font-bold py-2 tracking-tight mb-4 text-teal-900 text-center flex sm:hidden">
            MANAGE USERS
          </h1>
          <div className="flex rounded-lg overflow-hidden border h-10 lg:w-2/5">
            <button
              className={cn(
                `px-4 py-2 flex items-center w-1/2 justify-start h-10 space-x-1  ${
                  viewMode === "table"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-gray-700"
                }`
              )}
              onClick={() => handleViewModeChange("table")}
            >
              <List className="w-4 h-4 inline-block mr-1" />
              <span className="lg:flex hidden truncate">Table View</span>
            </button>
            <button
              className={cn(
                `px-4 py-2 flex items-center w-1/2 justify-start h-10 space-x-1 ${
                  viewMode === "card"
                    ? "bg-teal-600 text-white"
                    : "bg-white text-gray-700"
                }`
              )}
              onClick={() => handleViewModeChange("card")}
            >
              <Grid className="w-4 h-4 inline-block mr-1" />
              <span className="lg:flex hidden truncate">Card View</span>
            </button>
          </div>
        </div>
      </div>

      <Toaster />

      {viewMode === "table" ? (
        <>
          <div className="overflow-x-hidden">
            <Table className="items-center justify-center">
              <TableHeader className="text-center justify-center">
                <TableRow>
                  <TableHead onClick={() => handleSort("userId")}>
                    Id{" "}
                    {sortColumn === "userId" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("firstName")}>
                    Name{" "}
                    {sortColumn === "firstName" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("designation")}>
                    Designation
                    <span className="mb-0.5">
                      {sortColumn === "designation" &&
                        (sortDirection === "asc" ? "↑" : "↓")}
                    </span>
                  </TableHead>
                  <TableHead onClick={() => handleSort("laboratory")}>
                    Laboratory{" "}
                    {sortColumn === "laboratory" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("username")}>
                    Username{" "}
                    {sortColumn === "username" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("email")}>
                    Email{" "}
                    {sortColumn === "email" &&
                      (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead className="text-center">Phone Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.userId} className={"text-gray-900"}>
                      <TableCell>{user.userId}</TableCell>
                      <TableCell>{`${user.firstName} ${user.middleName} ${user.lastName}`}</TableCell>
                      <TableCell className="capitalize">
                        {user.designation}
                      </TableCell>
                      <TableCell className="capitalize">
                        {user.laboratory}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.username}
                      </TableCell>
                      <TableCell className="text-center lowercase">
                        {user.email}
                      </TableCell>
                      <TableCell className="text-center lowercase">
                        {user.phoneNumber}
                      </TableCell>
                      <TableCell>
                        {user.status.toLowerCase() === "deleted" ? (
                          <div className="w-full px-4 py-2 rounded-md bg-green-300 font-semibold text-red-500">
                            Deleted
                          </div>
                        ) : (
                          <Select
                            value={user.status}
                            onValueChange={(newStatus) => {
                              setSelectedUser(user);
                              handleEditStatus(user.userId, newStatus);
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-32 inline-flex",
                                user.status.toLowerCase() === "active"
                                  ? "bg-green-300 text-green-950 pl-6"
                                  : user.status.toLowerCase() === "inactive"
                                  ? "bg-gray-300 text-gray-950 pl-6"
                                  : user.status.toLowerCase() ===
                                    "unverified email"
                                  ? "bg-indigo-300 text-indigo-950"
                                  : user.status.toLowerCase() ===
                                    "unapproved account"
                                  ? "bg-yellow-300 text-yellow-950"
                                  : "bg-teal-300 text-teal-950"
                              )}
                            >
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Unverified Email">
                                Unverified Email
                              </SelectItem>
                              <SelectItem value="Unapproved Account">
                                Unapproved Account
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.status !== "Deleted" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-md text-cyan-600 hover:text-cyan-900 hover:bg-cyan-50"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 -mr-0.5" /> Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-md text-red-600 hover:text-red-900 hover:bg-red-50"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="w-4 h-4 -mr-1" /> Delete
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-gray-500"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <CustomPagination
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              currentPage={currentPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.userId}>
              <CardHeader>
                <CardTitle className="text-teal-900 pt-2">{`${user.firstName} ${user.middleName} ${user.lastName}`}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Designation: {user.designation}</p>
                <p>Laboratory: {user.laboratory}</p>
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
                <p>Phone Number: {user.phoneNumber}</p>
                <span className="flex gap-2">
                  <p className="">Status:</p>
                  {user.status.toLowerCase() === "deleted" ? (
                    <div className="w-full px-4 py-2 rounded-md bg-green-300 font-semibold text-red-500">
                      Deleted
                    </div>
                  ) : (
                    <Select
                      value={user.status}
                      onValueChange={(newStatus) => {
                        setSelectedUser(user);
                        handleEditStatus(user.userId, newStatus);
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-32 inline-flex h-6",
                          user.status.toLowerCase() === "active"
                            ? "bg-green-300 text-green-950 pl-10"
                            : user.status.toLowerCase() === "inactive"
                            ? "bg-gray-300 text-gray-950 pl-9"
                            : user.status.toLowerCase() === "unverified email"
                            ? "bg-indigo-300 text-indigo-950"
                            : user.status.toLowerCase() === "unapproved account"
                            ? "bg-yellow-300 text-yellow-950"
                            : "bg-teal-300 text-teal-950"
                        )}
                      >
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Unverified Email">
                          Unverified Email
                        </SelectItem>
                        <SelectItem value="Unapproved Account">
                          Unapproved Account
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </span>
                <div className="items-right text-right pt-16 pb-0">
                  <Button
                    size="sm"
                    className="mr-2 rounded-md text-cyan-600 hover:bg-cyan-50 hover:text-cyan-800 bg-cyan-50"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-md  text-red-600 hover:bg-red-50 hover:text-red-800 bg-red-50"
                    onClick={() => {
                      setSelectedUser(user);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="w-4 h-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          <button onClick={() => setIsCreateDialogOpen(true)}>
            <Card
              key="add-user-card"
              className="flex justify-center items-center bg-white hover:bg-teal-100 h-96"
            >
              <CardContent className="text-center w-full">
                <UserPlus
                  size={100}
                  className="text-teal-900 text-center w-full"
                />
              </CardContent>
            </Card>
          </button>
        </div>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white overflow-y-auto max-h-full md:h-auto md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight text-teal-900 mt-2">
              <UserPen className="text-teal-900 size-5 -mt-0.5" />
              Edit Account Details
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {selectedUser && (
            <EditAccount
              closeDialog={() => setIsEditDialogOpen(false)}
              editor="admin"
              userId={selectedUser.userId.toString()}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight">
              <TriangleAlert className="text-red-500 size-5 -mt-0.5" />
              Delete User
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <p className="text-left pt-2 text-sm">
            Are you sure you want to delete this user?
          </p>
          <p className="text-left bg-red-300 -mt-2 relative py-2 text-sm">
            <span className="pl-4">
              By deleting this user, they will be removed indefinitely.
            </span>
            <span className="absolute left-0 top-0 h-full w-2 bg-red-600"></span>
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              className="bg-gray-100"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleDeleteUser();
                setIsDeleteDialogOpen(true);
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white overflow-y-auto max-h-full md:h-auto md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 tracking-tight mb-4">
              <UserPlus className="text-teal-500 size-5 -mt-0.5" />
              Add User
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <CreateAccount closeDialog={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminView;
