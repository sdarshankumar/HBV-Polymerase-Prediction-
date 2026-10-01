import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export const FileUpload = ({ onFileSelect, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    const allowedTypes = [
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const allowedExtensions = [".csv", ".xlsx", ".xls"];

    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    
    if (!allowedExtensions.includes(extension)) {
      return "Invalid file type. Please upload a CSV or Excel file.";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "File too large. Maximum size is 10MB.";
    }

    return null;
  };

  const handleFile = useCallback((file) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      toast.error(validationError);
      return;
    }

    setSelectedFile(file);
    toast.success(`File "${file.name}" selected`);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto" data-testid="file-upload-container">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          upload-zone relative
          ${isDragging ? "active" : ""}
          ${error ? "error" : ""}
          ${selectedFile ? "border-success bg-success/5" : ""}
        `}
        data-testid="upload-dropzone"
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isLoading}
          data-testid="file-input"
        />

        <div className="flex flex-col items-center gap-4">
          {selectedFile ? (
            <>
              <div className="p-4 rounded-full bg-success/10">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : error ? (
            <>
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-medium text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try again with a valid file
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-muted">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports CSV and Excel files with SMILES column
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Maximum file size: 10MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {selectedFile && (
          <>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
              data-testid="clear-file-btn"
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-molecular-blue hover:bg-molecular-blue/90 text-white"
              data-testid="submit-file-btn"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Run Prediction"
              )}
            </Button>
          </>
        )}
      </div>

      {/* File Requirements */}
      <div className="mt-8 p-4 bg-muted/30 rounded-sm" data-testid="file-requirements">
        <h4 className="text-sm font-medium mb-2">File Requirements</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Must contain a column named <code className="bg-muted px-1 rounded">SMILES</code></li>
          <li>• Optional: <code className="bg-muted px-1 rounded">ID</code> or <code className="bg-muted px-1 rounded">Molecule_ID</code> column</li>
          <li>• Duplicate SMILES will be automatically removed</li>
          <li>• Invalid SMILES will be flagged in results</li>
        </ul>
      </div>
    </div>
  );
};
