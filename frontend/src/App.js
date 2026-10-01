import { useState, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Context
import { ThemeProvider } from "./context/ThemeContext";

// Components
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { FileUpload } from "./components/FileUpload";
import { SinglePredictor } from "./components/SinglePredictor";
import { ResultsTable } from "./components/ResultsTable";
import { ExportButton } from "./components/ExportButton";
import { HeroSection, AboutSection, WorkflowSection } from "./components/LandingContent";
import {
  ActivityDistributionChart,
  PIC50DistributionChart,
  ActivityBarChart,
  DescriptorScatterPlot,
  ConfidenceChart,
} from "./components/Charts";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";

// Icons
import { 
  Beaker, 
  Table2, 
  BarChart3, 
  Download, 
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomePage = () => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState(null);

  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true);
    setResults(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/predict`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResults(response.data);
      setJobId(response.data.job_id);
      toast.success(
        `Processed ${response.data.total_molecules} molecules successfully!`
      );

      // Scroll to results
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Prediction error:", error);
      const errorMessage = 
        error.response?.data?.detail || 
        "Failed to process file. Please check the file format.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGetStarted = () => {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReset = () => {
    setResults(null);
    setJobId(null);
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUseSampleData = async () => {
    setIsLoading(true);
    try {
      // Get sample data
      const sampleResponse = await axios.get(`${API}/sample-data`);
      const sampleData = sampleResponse.data;
      
      // Create CSV content
      const csvContent = "id,SMILES,name\n" + 
        sampleData.map(m => `${m.id},${m.smiles},${m.name}`).join("\n");
      
      // Create file from sample data
      const blob = new Blob([csvContent], { type: "text/csv" });
      const file = new File([blob], "sample_molecules.csv", { type: "text/csv" });
      
      await handleFileUpload(file);
    } catch (error) {
      console.error("Sample data error:", error);
      toast.error("Failed to load sample data");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="home-page">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection onGetStarted={handleGetStarted} />

        {/* About Section */}
        <AboutSection />

        {/* Workflow Section */}
        <WorkflowSection />

        {/* Single Predictor Section */}
        <section id="single-predictor" className="py-10" data-testid="single-predictor-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SinglePredictor />
          </div>
        </section>

        {/* Upload Section */}
        <section id="upload" className="py-20 bg-muted/30" data-testid="upload-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4">
                Run Prediction
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Upload your molecular data file to predict bioactivity against HBV polymerase.
              </p>
              
              {/* Sample Data Button */}
              <Button
                variant="outline"
                onClick={handleUseSampleData}
                disabled={isLoading}
                className="mb-8"
                data-testid="use-sample-data-btn"
              >
                <FileText className="mr-2 h-4 w-4" />
                Try with Sample Data
              </Button>
            </div>

            <FileUpload onFileSelect={handleFileUpload} isLoading={isLoading} />
          </div>
        </section>

        {/* Results Section */}
        {results && (
          <section id="results" className="py-20" data-testid="results-section">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="font-heading text-3xl font-semibold tracking-tight mb-2">
                    Prediction Results
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Date(results.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="gap-2"
                    data-testid="new-prediction-btn"
                  >
                    <RefreshCw className="h-4 w-4" />
                    New Prediction
                  </Button>
                  <ExportButton jobId={jobId} />
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="stat-card" data-testid="stat-total">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-molecular-blue/10">
                        <Beaker className="h-5 w-5 text-molecular-blue" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold">
                          {results.total_molecules}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Molecules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card" data-testid="stat-valid">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold">
                          {results.valid_molecules}
                        </p>
                        <p className="text-xs text-muted-foreground">Valid SMILES</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card" data-testid="stat-invalid">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-destructive/10">
                        <XCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold">
                          {results.invalid_molecules}
                        </p>
                        <p className="text-xs text-muted-foreground">Invalid SMILES</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stat-card" data-testid="stat-active">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-sm bg-bio-coral/10">
                        <BarChart3 className="h-5 w-5 text-bio-coral" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-semibold">
                          {results.statistics?.activity_distribution?.Active || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Active Compounds</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* pIC50 Stats */}
              {results.statistics?.pic50_stats && (
                <Card className="mb-8" data-testid="pic50-stats-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading">pIC₅₀ Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-mono font-semibold">
                          {results.statistics.pic50_stats.mean}
                        </p>
                        <p className="text-xs text-muted-foreground">Mean</p>
                      </div>
                      <div>
                        <p className="text-lg font-mono font-semibold">
                          {results.statistics.pic50_stats.std}
                        </p>
                        <p className="text-xs text-muted-foreground">Std Dev</p>
                      </div>
                      <div>
                        <p className="text-lg font-mono font-semibold">
                          {results.statistics.pic50_stats.min}
                        </p>
                        <p className="text-xs text-muted-foreground">Min</p>
                      </div>
                      <div>
                        <p className="text-lg font-mono font-semibold">
                          {results.statistics.pic50_stats.max}
                        </p>
                        <p className="text-xs text-muted-foreground">Max</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs for Table and Charts */}
              <Tabs defaultValue="table" className="w-full" data-testid="results-tabs">
                <TabsList className="mb-6">
                  <TabsTrigger value="table" className="gap-2" data-testid="tab-table">
                    <Table2 className="h-4 w-4" />
                    Data Table
                  </TabsTrigger>
                  <TabsTrigger value="charts" className="gap-2" data-testid="tab-charts">
                    <BarChart3 className="h-4 w-4" />
                    Visualizations
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="table">
                  <ResultsTable results={results.results} />
                </TabsContent>

                <TabsContent value="charts">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Activity Distribution */}
                    {results.statistics?.activity_distribution && (
                      <ActivityDistributionChart 
                        data={results.statistics.activity_distribution} 
                      />
                    )}

                    {/* Activity Bar Chart */}
                    {results.statistics?.activity_distribution && (
                      <ActivityBarChart 
                        data={results.statistics.activity_distribution} 
                      />
                    )}

                    {/* pIC50 Distribution */}
                    <PIC50DistributionChart results={results.results} />

                    {/* Confidence Distribution */}
                    <ConfidenceChart results={results.results} />

                    {/* Scatter Plot - Full Width */}
                    <div className="md:col-span-2">
                      <DescriptorScatterPlot results={results.results} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="hbv-predictor-theme">
      <div className="App">
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          toastOptions={{
            className: "font-sans",
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
