import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { getStoredAdminToken } from "@/lib/api";

export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getStoredAdminToken();
    if (!token) {
      setLocation("/admin/login");
    }
    setChecked(true);
  }, [setLocation]);

  if (!checked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-display tracking-widest uppercase text-sm">Checking admin access...</p>
      </div>
    );
  }

  if (!getStoredAdminToken()) return null;

  return <>{children}</>;
}
