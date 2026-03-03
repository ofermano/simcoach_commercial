import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Gauge, Loader2, LogOut, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { adminApiGet, adminApiPost, clearStoredAdminToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WhitelistApplication {
  id: number;
  email: string;
  status: string;
  applied_at: string;
}

interface WhitelistApplicationsPage {
  items: WhitelistApplication[];
  total: number;
  page: number;
  page_size: number;
}

async function fetchApplications(page: number, pageSize: number): Promise<WhitelistApplicationsPage> {
  const res = await adminApiGet(
    `/api/admin/whitelist/applications?page=${page}&page_size=${pageSize}`
  );
  if (res.status === 401) {
    clearStoredAdminToken();
    window.location.href = "/admin/login";
    return { items: [], total: 0, page, page_size: pageSize };
  }
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export default function AdminWhitelist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const {
    data: applicationsPage,
    isLoading,
    error,
  } = useQuery<WhitelistApplicationsPage>({
    queryKey: ["/api/admin/whitelist/applications", page],
    queryFn: () => fetchApplications(page, pageSize),
  });

  const applications = applicationsPage?.items ?? [];
  const total = applicationsPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const approveMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await adminApiPost(`/api/admin/whitelist/applications/${applicationId}/approve`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Approve failed");
      }
      return res.json();
    },
    onSuccess: (_, id) => {
      toast({ title: "Approved", description: "Signup email sent to the applicant." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whitelist/applications"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const res = await adminApiPost(`/api/admin/whitelist/applications/${applicationId}/deny`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Deny failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Denied", description: "Application denied." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whitelist/applications"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleLogout = () => {
    clearStoredAdminToken();
    window.location.href = "/admin/login";
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return s;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 glass-panel border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="inline-flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-primary" />
                </div>
                <span className="font-display font-bold text-xl tracking-wider text-white">FLOW Admin</span>
              </Link>
              <span className="text-muted-foreground text-sm font-display uppercase tracking-wider">Whitelist</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-muted-foreground hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <h1 className="text-xl font-display font-bold text-white tracking-wider">Pending whitelist applications</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Approve to send a signup link to the applicant. Deny to reject the request.
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">Failed to load applications. You may need to sign in again.</p>
              <Link href="/admin/login">
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive">
                  Go to login
                </Button>
              </Link>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : applications.length === 0 && !error ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="font-display uppercase tracking-wider text-sm">No pending applications</p>
              <p className="text-sm mt-1">New requests will appear here.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-display uppercase tracking-wider text-xs">Email</TableHead>
                  <TableHead className="text-muted-foreground font-display uppercase tracking-wider text-xs">Applied</TableHead>
                  <TableHead className="text-muted-foreground font-display uppercase tracking-wider text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{app.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(app.applied_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                          onClick={() => approveMutation.mutate(app.id)}
                          disabled={approveMutation.isPending || denyMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          onClick={() => denyMutation.mutate(app.id)}
                          disabled={approveMutation.isPending || denyMutation.isPending}
                        >
                          {denyMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1.5" />
                              Deny
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/10 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 border-white/10"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 border-white/10"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
