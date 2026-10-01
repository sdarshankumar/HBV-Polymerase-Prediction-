import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const COLORS = {
  Active: "#10B981",
  Moderate: "#F59E0B",
  Inactive: "#64748B",
};

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="font-medium text-sm">{label || payload[0]?.name}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-xs text-muted-foreground">
            {entry.name}: <span className="font-mono">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ActivityDistributionChart = ({ data }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
    fill: COLORS[name] || CHART_COLORS[0],
  }));

  return (
    <Card className="result-card" data-testid="activity-distribution-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">Activity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-4">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const PIC50DistributionChart = ({ results }) => {
  // Create histogram bins for pIC50 values
  const validResults = results.filter((r) => r.is_valid && r.pic50 != null);
  
  const bins = [
    { range: "4.0-5.0", min: 4, max: 5, count: 0 },
    { range: "5.0-6.0", min: 5, max: 6, count: 0 },
    { range: "6.0-7.0", min: 6, max: 7, count: 0 },
    { range: "7.0-8.0", min: 7, max: 8, count: 0 },
    { range: "8.0-9.0", min: 8, max: 9, count: 0 },
    { range: "9.0-10.0", min: 9, max: 10, count: 0 },
  ];

  validResults.forEach((r) => {
    const bin = bins.find((b) => r.pic50 >= b.min && r.pic50 < b.max);
    if (bin) bin.count++;
  });

  return (
    <Card className="result-card" data-testid="pic50-distribution-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">pIC₅₀ Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={bins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 11 }} 
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              name="Molecules"
              fill="#3B82F6" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ActivityBarChart = ({ data }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card className="result-card" data-testid="activity-bar-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">Active vs Inactive Compounds</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name="Count" radius={[0, 2, 2, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const DescriptorScatterPlot = ({ results }) => {
  const validResults = results
    .filter((r) => r.is_valid && r.descriptors)
    .map((r) => ({
      mw: r.descriptors.molecular_weight,
      logp: r.descriptors.logp,
      pic50: r.pic50,
      activity: r.activity_class,
    }));

  return (
    <Card className="result-card" data-testid="descriptor-scatter-plot">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">MW vs LogP (colored by pIC₅₀)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              type="number" 
              dataKey="mw" 
              name="MW" 
              tick={{ fontSize: 11 }}
              label={{ value: "Molecular Weight", position: "bottom", fontSize: 11 }}
            />
            <YAxis 
              type="number" 
              dataKey="logp" 
              name="LogP" 
              tick={{ fontSize: 11 }}
              label={{ value: "LogP", angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <p className="text-xs">MW: <span className="font-mono">{data.mw?.toFixed(1)}</span></p>
                      <p className="text-xs">LogP: <span className="font-mono">{data.logp?.toFixed(2)}</span></p>
                      <p className="text-xs">pIC₅₀: <span className="font-mono">{data.pic50?.toFixed(2)}</span></p>
                      <p className="text-xs">Activity: {data.activity}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Scatter 
              name="Active" 
              data={validResults.filter(r => r.activity === "Active")} 
              fill={COLORS.Active}
            />
            <Scatter 
              name="Moderate" 
              data={validResults.filter(r => r.activity === "Moderate")} 
              fill={COLORS.Moderate}
            />
            <Scatter 
              name="Inactive" 
              data={validResults.filter(r => r.activity === "Inactive")} 
              fill={COLORS.Inactive}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const ConfidenceChart = ({ results }) => {
  const confidenceBins = [
    { range: "50-60%", min: 0.5, max: 0.6, count: 0 },
    { range: "60-70%", min: 0.6, max: 0.7, count: 0 },
    { range: "70-80%", min: 0.7, max: 0.8, count: 0 },
    { range: "80-90%", min: 0.8, max: 0.9, count: 0 },
    { range: "90-100%", min: 0.9, max: 1.0, count: 0 },
  ];

  results.forEach((r) => {
    if (r.confidence != null) {
      const bin = confidenceBins.find(
        (b) => r.confidence >= b.min && r.confidence < b.max
      );
      if (bin) bin.count++;
    }
  });

  return (
    <Card className="result-card" data-testid="confidence-chart">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-heading">Prediction Confidence Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={confidenceBins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 11 }} 
            />
            <YAxis 
              tick={{ fontSize: 11 }} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              name="Predictions"
              fill="#8B5CF6" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
