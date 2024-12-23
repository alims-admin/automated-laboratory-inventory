"use client";
import Biological from "@/components/molecules/biological";
import CalibrationLogs from "@/components/molecules/calibration-logs";
import Chemical from "@/components/molecules/chemical";
import Disposition from "@/components/molecules/disposition";
import GeneralSupplies from "@/components/molecules/general";
import PurchaseOrder from "@/components/molecules/purchase-order";
import Reagent from "@/components/molecules/reagent";
import ReagentDispense from "@/components/molecules/reagent-dispense";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Package,
  ShoppingBag,
  Sliders,
  Thermometer,
  LogOut,
  FlaskConical,
  Syringe,
  Dna,
  Microscope,
  FileMinus,
  FlaskConicalOff,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Incident from "@/components/molecules/incident";
import Borrow from "@/components/molecules/borrow";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DashboardPage = () => {
  const labSlug = useParams().labSlug;
  const savedInventoryTab = localStorage.getItem("activeInventoryTab");
  const savedActiveTab = localStorage.getItem("activeTab");

  const [activeInventoryTab, setActiveInventoryTab] = useState(
    savedInventoryTab || "biological"
  );
  const [activeTab, setActiveTab] = useState(savedActiveTab || "inventory");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem("activeInventoryTab", activeInventoryTab);
    localStorage.setItem("activeTab", activeTab);
  }, [labSlug, activeInventoryTab, activeTab]);

  const getIconByLab = (labSlug: string | string[]) => {
    switch (labSlug) {
      case "pathology":
        return (
          <Microscope
            size={32}
            strokeWidth={3}
            className="text-teal-700 mr-3"
          />
        );
      case "immunology":
        return (
          <Syringe size={32} strokeWidth={3} className="text-teal-700 mr-3" />
        );
      case "microbiology":
        return <Dna size={32} strokeWidth={3} className="text-teal-700 mr-3" />;
      default:
        return (
          <FlaskConical
            size={32}
            strokeWidth={3}
            className="text-teal-700 mr-3"
          />
        );
    }
  };

  return (
    <div className="h-full w-full max-w-screen overflow-auto flex flex-col items-center md:items-start">
      <div className="flex-grow w-full">
        <div className="flex flex-col md:flex-row items-center justify-center mb-8 pt-8 text-center md:text-left space-y-4 md:space-y-0 md:space-x-4">
          {getIconByLab(labSlug)}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-700 capitalize">
            {cn(labSlug ? `${labSlug} Laboratory` : "Loading...")}
          </h1>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="rounded-xl bg-white border-2 border-teal-100 w-full max-w-[1445px] place-self-center overflow-hidden"
        >
          <TabsList
            className="flex justify-around bg-teal-50 text-black rounded-b-none py-6 overflow-x-auto"
            style={{
              overflowY: "hidden",
              scrollbarWidth: "thin",
            }}
          >
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger>
                <TabsTrigger
                  value="inventory"
                  onClick={() => setActiveTab("inventory")}
                  className="flex items-center space-x-2"
                >
                  <Package size={20} />
                  <span className="font-medium">Inventory</span>
                </TabsTrigger>
              </PopoverTrigger>
              <PopoverContent className="bg-white shadow-md rounded-lg w-56 max-h-48 overflow-y-auto md:hidden">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => {
                        setActiveInventoryTab("biological");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg",
                        activeInventoryTab === "biological" ? "bg-teal-50" : ""
                      )}
                    >
                      Biological
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActiveInventoryTab("chemical");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg",
                        activeInventoryTab === "chemical" ? "bg-teal-50" : ""
                      )}
                    >
                      Chemical
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActiveInventoryTab("general");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg",
                        activeInventoryTab === "general" ? "bg-teal-50" : ""
                      )}
                    >
                      General
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActiveInventoryTab("reagent");
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 rounded-lg",
                        activeInventoryTab === "reagent" ? "bg-teal-50" : ""
                      )}
                    >
                      Reagent
                    </button>
                  </li>
                </ul>
              </PopoverContent>
            </Popover>

            <TabsTrigger
              value="purchaseOrder"
              onClick={() => setActiveTab("purchaseOrder")}
              className="flex items-center space-x-2"
            >
              <ShoppingBag size={20} />
              <span className="font-medium">Purchase Order</span>
            </TabsTrigger>
            <TabsTrigger
              value="borrow"
              onClick={() => setActiveTab("borrow")}
              className="flex items-center space-x-2"
            >
              <FileMinus size={20} />
              <span className="font-medium">Borrow Forms</span>
            </TabsTrigger>
            <TabsTrigger
              value="incident"
              onClick={() => setActiveTab("incident")}
              className="flex items-center space-x-2"
            >
              <FlaskConicalOff size={20} />
              <span className="font-medium">Incident Forms</span>
            </TabsTrigger>
            <TabsTrigger
              value="disposition"
              onClick={() => setActiveTab("disposition")}
              className="flex items-center space-x-2"
            >
              <LogOut size={20} />
              <span className="font-medium">Disposition</span>
            </TabsTrigger>
            <TabsTrigger
              value="calibrationLogs"
              onClick={() => setActiveTab("calibrationLogs")}
              className="flex items-center space-x-2"
            >
              <Sliders size={20} />
              <span className="font-medium">Calibration Logs</span>
            </TabsTrigger>
            <TabsTrigger
              value="reagentsDispense"
              onClick={() => setActiveTab("reagentsDispense")}
              className="flex items-center space-x-2"
            >
              <Thermometer size={20} />
              <span className="font-medium">Reagents Dispense</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <div className="flex flex-col md:flex-row gap-2 overflow-hidden">
              <div className="md:w-1/12 w-full md:border-r-2 border-teal-100 md:px-4 px-2 md:block hidden overflow-hidden">
                <ul className="space-y-2 py-4">
                  <li
                    className={cn(
                      `cursor-pointer p-2 rounded-md ${
                        activeInventoryTab === "biological"
                          ? "bg-teal-100 text-black"
                          : "hover:bg-teal-50"
                      }`
                    )}
                    onClick={() => setActiveInventoryTab("biological")}
                  >
                    Biological
                  </li>
                  <li
                    className={cn(
                      `cursor-pointer p-2 rounded-md ${
                        activeInventoryTab === "chemical"
                          ? "bg-teal-100 text-black"
                          : "hover:bg-teal-50"
                      }`
                    )}
                    onClick={() => setActiveInventoryTab("chemical")}
                  >
                    Chemical
                  </li>
                  <li
                    className={cn(
                      `cursor-pointer p-2 rounded-md ${
                        activeInventoryTab === "general"
                          ? "bg-teal-100 text-black"
                          : "hover:bg-teal-50"
                      }`
                    )}
                    onClick={() => setActiveInventoryTab("general")}
                  >
                    General
                  </li>
                  <li
                    className={cn(
                      `cursor-pointer p-2 rounded-md ${
                        activeInventoryTab === "reagent"
                          ? "bg-teal-100 text-black"
                          : "hover:bg-teal-50"
                      }`
                    )}
                    onClick={() => setActiveInventoryTab("reagent")}
                  >
                    Reagent
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-11/12">
                {activeInventoryTab === "biological" && <Biological />}
                {activeInventoryTab === "chemical" && <Chemical />}
                {activeInventoryTab === "general" && <GeneralSupplies />}
                {activeInventoryTab === "reagent" && <Reagent />}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="purchaseOrder">
            <PurchaseOrder />
          </TabsContent>
          <TabsContent value="borrow">
            <Borrow />
          </TabsContent>
          <TabsContent value="incident">
            <Incident />
          </TabsContent>
          <TabsContent value="disposition">
            <Disposition />
          </TabsContent>
          <TabsContent value="calibrationLogs">
            <CalibrationLogs />
          </TabsContent>
          <TabsContent value="reagentsDispense">
            <ReagentDispense />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
