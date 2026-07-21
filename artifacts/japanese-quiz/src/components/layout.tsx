import { useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Database, PlusCircle, LayoutDashboard, BrainCircuit, PenTool, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Library", href: "/browse", icon: Database },
  { name: "Add Entry", href: "/add", icon: PlusCircle },
  { name: "Multiple Choice", href: "/practice/multiple-choice", icon: BrainCircuit },
  { name: "Sentence Output", href: "/practice/sentence", icon: PenTool },
];

function NavContent({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-4 py-4 space-y-1">
      <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-3 px-3">Menu</div>
      {navItems.slice(0, 3).map((item) => {
        const isActive = location === item.href || (location.startsWith("/edit") && item.href === "/browse");
        return (
          <Link key={item.name} href={item.href}>
            <div
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="text-sm">{item.name}</span>
            </div>
          </Link>
        );
      })}

      <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase mt-8 mb-3 px-3">Practice</div>
      {navItems.slice(3).map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.name} href={item.href}>
            <div
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="text-sm">{item.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden selection:bg-primary/20">
      {/* Desktop Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-border bg-card flex-col h-full z-10 relative">
        <div className="p-6 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-serif font-bold text-xl tracking-wide">漢字の道</span>
        </div>

        <NavContent location={location} />

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <div className="text-xs text-muted-foreground font-medium">Study Session Active</div>
          </div>
        </div>
      </aside>

      {/* Right-side column: mobile header + scrollable main */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Mobile Header — hidden on desktop */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-lg tracking-wide">漢字の道</span>
          </div>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 flex flex-col">
              <div className="p-6 flex items-center gap-3 border-b border-border">
                <BookOpen className="w-6 h-6 text-primary" />
                <span className="font-serif font-bold text-xl tracking-wide">漢字の道</span>
              </div>
              <NavContent location={location} onNavigate={() => setMobileOpen(false)} />
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <div className="text-xs text-muted-foreground font-medium">Study Session Active</div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative bg-[#FDFBF7] dark:bg-[#151413]">
          <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.02] mix-blend-multiply dark:mix-blend-screen bg-[url('/noise.svg')] z-0"></div>
          <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
