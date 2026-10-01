import { 
  Beaker, 
  FlaskConical, 
  Activity, 
  BarChart3,
  FileSearch,
  CheckCircle,
  Dna,
  ArrowDown
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export const HeroSection = ({ onGetStarted }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center hero-bg" data-testid="hero-section">
      {/* Background Image */}
      <img
        src="https://images.unsplash.com/photo-1740666387475-548de5c37691?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MjJ8MHwxfHNlYXJjaHwxfHxtb2xlY3VsYXIlMjBzdHJ1Y3R1cmUlMjBhYnN0cmFjdCUyMDNkfGVufDB8fHx8MTc2OTc4NDg1MXww&ixlib=rb-4.1.0&q=85"
        alt=""
        className="hero-bg-image"
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-molecular-blue/10 border border-molecular-blue/20 mb-8">
            <Dna className="h-4 w-4 text-molecular-blue" />
            <span className="text-sm font-medium text-molecular-blue">Antiviral Drug Discovery</span>
          </div>

          {/* Title */}
          <h1 className="font-heading text-5xl md:text-7xl tracking-tight font-light mb-6">
            HBV Polymerase
            <span className="block font-semibold text-molecular-blue">Bioactivity Predictor</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
            An in-silico screening platform leveraging machine learning to predict 
            inhibitory bioactivity of small molecules against Hepatitis B Virus polymerase.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 mb-12">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-molecular-blue hover:bg-molecular-blue/90 text-white h-12 px-8"
              data-testid="hero-get-started-btn"
            >
              Start Prediction
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="h-12 px-8"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="hero-learn-more-btn"
            >
              Learn More
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="text-center">
              <p className="text-2xl font-heading font-semibold text-molecular-blue">pIC₅₀</p>
              <p className="text-xs text-muted-foreground">Prediction</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-semibold text-bio-coral">RDKit</p>
              <p className="text-xs text-muted-foreground">Descriptors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-heading font-semibold text-success">ML</p>
              <p className="text-xs text-muted-foreground">Powered</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-muted/30" data-testid="about-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
              About HBV Polymerase
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Hepatitis B Virus (HBV) polymerase is a multifunctional enzyme essential 
                for viral replication. It serves as a critical drug target for developing 
                antiviral therapeutics against chronic hepatitis B infection.
              </p>
              <p>
                Our platform enables researchers to rapidly screen compound libraries 
                against HBV polymerase, predicting bioactivity using machine learning 
                models trained on experimental data.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-sm bg-molecular-blue/10">
                    <FlaskConical className="h-5 w-5 text-molecular-blue" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Virtual Screening</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Screen thousands of compounds in silico
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 rounded-sm bg-success/10">
                    <Activity className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">pIC₅₀ Prediction</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quantitative bioactivity values
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Image */}
          <div className="relative rounded-sm overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1631558554770-74e921444006?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxzY2llbnRpc3QlMjBsb29raW5nJTIwYXQlMjBkYXRhJTIwc2NyZWVufGVufDB8fHx8MTc2OTc4NDg1M3ww&ixlib=rb-4.1.0&q=85"
              alt="Scientist analyzing data"
              className="w-full h-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export const WorkflowSection = () => {
  const steps = [
    {
      icon: FileSearch,
      title: "Upload Data",
      description: "Upload CSV/Excel file containing molecular SMILES",
      color: "molecular-blue"
    },
    {
      icon: CheckCircle,
      title: "Validation",
      description: "SMILES validation and duplicate removal",
      color: "bio-coral"
    },
    {
      icon: Beaker,
      title: "Descriptor Generation",
      description: "Calculate molecular descriptors using RDKit",
      color: "success"
    },
    {
      icon: Activity,
      title: "ML Prediction",
      description: "Predict pIC₅₀ and activity classification",
      color: "warning"
    },
    {
      icon: BarChart3,
      title: "Analysis",
      description: "View results with interactive visualizations",
      color: "molecular-blue"
    }
  ];

  return (
    <section id="workflow" className="py-20" data-testid="workflow-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our pipeline processes molecular data through validation, descriptor calculation, 
            and machine learning prediction to deliver comprehensive bioactivity insights.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="relative section-animate"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <Card className="bg-card border-border h-full hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-sm bg-${step.color}/10 flex items-center justify-center mb-4`}>
                    <step.icon className={`h-6 w-6 text-${step.color}`} />
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mb-2">
                    Step {idx + 1}
                  </div>
                  <h3 className="font-heading font-medium mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              
              {/* Connector arrow */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <div className="w-4 h-0.5 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
