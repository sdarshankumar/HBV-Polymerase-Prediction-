import { Beaker, Github, ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-muted/30" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-molecular-blue/10 rounded-sm">
                <Beaker className="h-5 w-5 text-molecular-blue" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">HBV Polymerase Predictor</h3>
                <p className="text-xs text-muted-foreground">Bioactivity Prediction Platform</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              An in-silico screening platform for predicting small molecule inhibitors 
              against Hepatitis B Virus polymerase using machine learning.
            </p>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-heading font-medium">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-foreground transition-colors">
                  About HBV Polymerase
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-foreground transition-colors">
                  Methodology
                </a>
              </li>
              <li>
                <a 
                  href="https://www.rdkit.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  RDKit Documentation <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Technical */}
          <div className="space-y-4">
            <h4 className="font-heading font-medium">Technical Stack</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Frontend: React + Tailwind CSS</li>
              <li>Backend: Python FastAPI</li>
              <li>Cheminformatics: RDKit</li>
              <li>Visualization: Recharts</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} HBV Polymerase Bioactivity Predictor. 
            For research purposes only.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for drug discovery and antiviral research
          </p>
        </div>
      </div>
    </footer>
  );
};
