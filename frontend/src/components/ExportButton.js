import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ExportButton = ({ jobId }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const response = await axios.get(`${API}/export/${jobId}?format=${format}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `hbv_predictions_${jobId.slice(0, 8)}.${format === "excel" ? "xlsx" : "csv"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export results");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={isExporting}
          data-testid="export-btn"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export Results
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={5} className="z-50">
        <DropdownMenuItem 
          onClick={() => handleExport("csv")}
          className="gap-2 cursor-pointer"
          data-testid="export-csv"
        >
          <FileText className="h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("excel")}
          className="gap-2 cursor-pointer"
          data-testid="export-excel"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
