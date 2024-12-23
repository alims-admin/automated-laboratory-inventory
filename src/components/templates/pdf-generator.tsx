import React from "react";
import { jsPDF } from "jspdf";
import { Button } from "../ui/button";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface PdfGeneratorProps {
  pdfTitle?: string;
  pageSize?: string;
  orientation?: "portrait" | "landscape";
  tableHeaders: string[];
  tableData: (string | number)[][];
  closeDialog: () => void;
}

const PdfGenerator: React.FC<PdfGeneratorProps> = ({
  pdfTitle = "Stock Level Report",
  pageSize = "a4",
  orientation = "portrait",
  tableHeaders = [],
  tableData = [],
  closeDialog,
}) => {
  const handlePrint = () => {
    const pageSizes: Record<
      string,
      { format: string | number[]; dimensions?: number[] }
    > = {
      a4: { format: "a4", dimensions: [210, 297] },
      short: { format: [215.9, 279.4] },
      long: { format: [215.9, 355.6] },
    };

    const selectedPage = pageSizes[pageSize.toLowerCase()];

    if (!selectedPage) {
      console.error(`Invalid page size: ${pageSize}`);
      return;
    }

    const isLandscape = orientation === "landscape";
    const isLong = pageSize === "long";
    const adjustedFormat =
      isLandscape && Array.isArray(selectedPage.format)
        ? [selectedPage.format[1], selectedPage.format[0]]
        : selectedPage.format;

    const doc = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: adjustedFormat,
    });

    const currentDate = new Date();
    const formattedDate = format(currentDate, "MM/dd/yyyy");
    const formattedDateForFile = format(currentDate, "MM-dd-yyyy");

    const baseUrl = window.location.origin;
    const imgElement1 = new Image();
    const imgElement2 = new Image();

    imgElement1.src = `${baseUrl}/images/mrl-logo.png`;
    imgElement2.src = `${baseUrl}/images/pgh-logo.png`;

    Promise.all([
      new Promise((resolve) => (imgElement1.onload = resolve)),
      new Promise((resolve) => (imgElement2.onload = resolve)),
    ]).then(() => {
      doc.addImage(
        imgElement1,
        "PNG",
        isLandscape ? (isLong ? 90 : 60) : 30,
        10,
        30,
        30
      );
      doc.addImage(
        imgElement2,
        "PNG",
        isLandscape ? (isLong ? 230 : 200) : 150,
        10,
        30,
        30
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const headerText = [
        "PHILIPPINE GENERAL HOSPITAL",
        "The National University Hospital",
        "University of the Philippines Manila",
        "MEDICAL RESEARCH LABORATORY",
        "Department of Medicine",
        "Taft Avenue, Manila",
        "Tel. no. 8554-8400 loc. 3232",
      ];
      let y = 15;

      doc.setFont("helvetica", "bold");
      doc.text(headerText[0], isLandscape ? (isLong ? 175 : 143) : 105, y, {
        align: "center",
      });
      y += 5;

      doc.setFont("helvetica", "normal");
      headerText.slice(1, 3).forEach((text) => {
        doc.text(text, isLandscape ? (isLong ? 175 : 143) : 105, y, {
          align: "center",
        });
        y += 5;
      });

      doc.setFont("helvetica", "bold");
      doc.text(headerText[3], isLandscape ? (isLong ? 175 : 143) : 105, y, {
        align: "center",
      });
      y += 5;

      doc.setFont("helvetica", "normal");
      headerText.slice(4).forEach((text) => {
        doc.text(text, isLandscape ? (isLong ? 175 : 143) : 105, y, {
          align: "center",
        });
        y += 5;
      });

      y += 8;
      doc.setFont("times", "italic");
      doc.text(
        "PHIC - Accredited Health Care Provider",
        isLandscape ? (isLong ? 175 : 143) : 105,
        y,
        {
          align: "center",
        }
      );
      y += 5;
      doc.text(
        "ISO 9001 CERTIFIED",
        isLandscape ? (isLong ? 175 : 143) : 105,
        y,
        {
          align: "center",
        }
      );
      y += 5;
      doc.text(
        "TUV-SUD, Asia Pacific, Ltd",
        isLandscape ? (isLong ? 175 : 143) : 105,
        y,
        {
          align: "center",
        }
      );
      y += 15;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(pdfTitle, isLandscape ? (isLong ? 175 : 143) : 105, y, {
        align: "center",
      });
      y += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      const x = 10;
      const textY = y;

      const baseText = "Date Generated: ";
      doc.text(baseText + formattedDate, x, textY);

      const baseTextWidth = doc.getTextWidth(baseText);
      const dateWidth = doc.getTextWidth(formattedDate);

      doc.line(
        x + baseTextWidth,
        textY + 1.5,
        x + baseTextWidth + dateWidth,
        textY + 1.5
      );

      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { right: 10, left: 10 },
        head: [tableHeaders],
        body: tableData,
        styles: {
          font: "helvetica",
          fontSize: 11,
          cellPadding: 2,
          overflow: "linebreak",
          valign: "middle",
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        columnStyles: {
          0: { cellWidth: 10 },
        },
        theme: "grid",
        tableWidth: "auto",
      });

      doc.save(`${pdfTitle}-${formattedDateForFile}.pdf`);
      closeDialog();
    });
  };

  return (
    <Button
      className="justify-end bg-teal-500 text-white hover:bg-teal-700 transition-colors duration-300 ease-in-out"
      onClick={handlePrint}
    >
      Confirm
    </Button>
  );
};

export default PdfGenerator;
