import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Search, Activity, Beaker, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000'}/api`;

export function SinglePredictor() {
  const [compoundName, setCompoundName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [loadingState, setLoadingState] = useState("");

  const handlePredict = async () => {
    if (!compoundName.trim()) {
      toast.error("Please enter a compound name");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setLoadingState("Searching compound...");

    try {
      // Simulate multiple loading states for UX as requested
      setTimeout(() => setLoadingState("Retrieving molecular data..."), 800);
      setTimeout(() => setLoadingState("Running prediction..."), 1600);

      const response = await axios.post(`${API}/predict_single`, {
        compound_name: compoundName.trim()
      });

      setResult(response.data);
      if (response.data.is_valid) {
        toast.success("Prediction complete!");
      } else {
        toast.error("Invalid compound structure.");
      }
    } catch (error) {
      console.error("Prediction error:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Compound not found or an error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingState("");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12" data-testid="single-predictor">
      <Card className="shadow-lg border-primary/20 bg-card">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="flex items-center gap-2 text-xl font-heading text-primary">
            <Activity className="h-5 w-5" />
            HBV Polymerase Bioactivity Predictor
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a compound name (e.g., Deoxyadenosine, Entecavir) to lookup properties and predict HBV Polymerase bioactivity.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter Compound Name / ID"
                value={compoundName}
                onChange={(e) => setCompoundName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePredict();
                }}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handlePredict} disabled={isLoading} className="sm:w-32">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Predicting
                </span>
              ) : (
                "Predict"
              )}
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-8 text-muted-foreground animate-pulse">
              <p>{loadingState}</p>
            </div>
          )}

          {result && (
            <div className="bg-muted/30 rounded-lg border p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="font-medium text-lg flex items-center gap-2">
                  <Beaker className="h-5 w-5 text-molecular-blue" />
                  ID: <span className="font-semibold">{result.id}</span>
                </div>
                {result.is_valid ? (
                   <Badge variant="outline" className="bg-success/10 text-success border-success/20 flex gap-1 items-center">
                     <CheckCircle2 className="h-3 w-3" /> Valid Structure
                   </Badge>
                ) : (
                   <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 flex gap-1 items-center">
                     <XCircle className="h-3 w-3" /> Invalid Structure
                   </Badge>
                )}
              </div>

              {result.smiles && (
                <div className="break-all font-mono text-sm bg-background p-2 rounded border">
                  <span className="text-muted-foreground font-sans text-xs uppercase tracking-wider mb-1 block">SMILES</span>
                  {result.smiles}
                </div>
              )}

              {result.is_valid && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div className="bg-background p-3 rounded border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">pIC50</p>
                    <p className="text-xl font-bold font-mono">{result.pic50}</p>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Activity</p>
                    <p className="text-lg font-semibold">{result.activity_class}</p>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Confidence</p>
                    <p className="text-lg font-medium">{result.confidence}</p>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">MW</p>
                    <p className="text-sm font-mono">
                      {result.mw ? result.mw.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-background p-3 rounded border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">LogP</p>
                    <p className="text-sm font-mono">
                      {result.logp ? result.logp.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
