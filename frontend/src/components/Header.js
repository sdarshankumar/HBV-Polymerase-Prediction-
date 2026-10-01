import { Moon, Sun, Beaker, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Button } from "./ui/button";
import { useState } from "react";

export const Header = () => {
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header 
      className="sticky top-0 z-50 glass border-b border-border/50"
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3" data-testid="logo">
            <div className="p-2 bg-molecular-blue/10 rounded-sm">
              <Beaker className="h-5 w-5 text-molecular-blue" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading font-semibold text-lg tracking-tight">
                HBV Polymerase
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">
                Bioactivity Predictor
              </p>
            </div>
            <span className="sm:hidden font-heading font-semibold">HBV Predictor</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a 
              href="#about" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-about"
            >
              About
            </a>
            <a 
              href="#workflow" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-workflow"
            >
              Workflow
            </a>
            <a 
              href="#upload" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-predict"
            >
              Predict
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="theme-toggle"
              data-testid="theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border/50" data-testid="mobile-menu">
            <div className="flex flex-col gap-2">
              <a 
                href="#about" 
                className="px-3 py-2 text-sm hover:bg-muted rounded-sm transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#workflow" 
                className="px-3 py-2 text-sm hover:bg-muted rounded-sm transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Workflow
              </a>
              <a 
                href="#upload" 
                className="px-3 py-2 text-sm hover:bg-muted rounded-sm transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Predict
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
