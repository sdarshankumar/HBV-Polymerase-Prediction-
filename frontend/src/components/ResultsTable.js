import { useState, useMemo } from "react";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search,
  CheckCircle2,
  XCircle,
  Copy
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";

export const ResultsTable = ({ results }) => {
  const [sortField, setSortField] = useState("molecule_id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [validityFilter, setValidityFilter] = useState("all");

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.molecule_id.toLowerCase().includes(query) ||
          r.smiles.toLowerCase().includes(query)
      );
    }

    // Activity filter
    if (activityFilter !== "all") {
      filtered = filtered.filter((r) => r.activity_class === activityFilter);
    }

    // Validity filter
    if (validityFilter !== "all") {
      const isValid = validityFilter === "valid";
      filtered = filtered.filter((r) => r.is_valid === isValid);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || "";
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [results, searchQuery, activityFilter, validityFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const getActivityBadge = (activity) => {
    const classes = {
      Active: "badge-active",
      Moderate: "badge-moderate",
      Inactive: "badge-inactive",
    };
    return (
      <Badge className={`${classes[activity] || ""} text-xs font-medium`}>
        {activity || "N/A"}
      </Badge>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const ConfidenceMeter = ({ value }) => {
    if (!value) return <span className="text-muted-foreground">-</span>;
    const percentage = Math.round(value * 100);
    const color =
      percentage >= 80
        ? "bg-emerald-500"
        : percentage >= 60
        ? "bg-amber-500"
        : "bg-slate-400";

    return (
      <div className="flex items-center gap-2">
        <div className="confidence-meter w-16">
          <div
            className={`confidence-fill ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {percentage}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="results-table-container">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or SMILES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="search-input"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[140px]" data-testid="activity-filter">
              <SelectValue placeholder="Activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={validityFilter} onValueChange={setValidityFilter}>
            <SelectTrigger className="w-[130px]" data-testid="validity-filter">
              <SelectValue placeholder="Validity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="valid">Valid</SelectItem>
              <SelectItem value="invalid">Invalid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredResults.length} of {results.length} molecules
      </p>

      {/* Table */}
      <div className="table-scroll border border-border rounded-sm">
        <table className="data-table" data-testid="results-table">
          <thead>
            <tr>
              <th>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort("molecule_id")}
                  data-testid="sort-molecule-id"
                >
                  ID <SortIcon field="molecule_id" />
                </Button>
              </th>
              <th>SMILES</th>
              <th>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort("is_valid")}
                  data-testid="sort-valid"
                >
                  Valid <SortIcon field="is_valid" />
                </Button>
              </th>
              <th>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort("pic50")}
                  data-testid="sort-pic50"
                >
                  pIC₅₀ <SortIcon field="pic50" />
                </Button>
              </th>
              <th>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  onClick={() => handleSort("activity_class")}
                  data-testid="sort-activity"
                >
                  Activity <SortIcon field="activity_class" />
                </Button>
              </th>
              <th>Confidence</th>
              <th>MW</th>
              <th>LogP</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, idx) => (
              <tr key={result.molecule_id || idx} data-testid={`result-row-${idx}`}>
                <td className="font-mono text-xs">{result.molecule_id}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <code className="smiles-code" title={result.smiles}>
                      {result.smiles.length > 30
                        ? result.smiles.substring(0, 30) + "..."
                        : result.smiles}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(result.smiles)}
                      data-testid={`copy-smiles-${idx}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td>
                  {result.is_valid ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </td>
                <td className="font-mono">
                  {result.pic50 != null ? result.pic50.toFixed(2) : "-"}
                </td>
                <td>{getActivityBadge(result.activity_class)}</td>
                <td>
                  <ConfidenceMeter value={result.confidence} />
                </td>
                <td className="font-mono text-xs">
                  {result.descriptors?.molecular_weight?.toFixed(1) || "-"}
                </td>
                <td className="font-mono text-xs">
                  {result.descriptors?.logp?.toFixed(2) || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredResults.length === 0 && (
        <div className="text-center py-12 text-muted-foreground" data-testid="no-results">
          <p>No molecules match your filters</p>
        </div>
      )}
    </div>
  );
};
