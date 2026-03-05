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
import { Gauge, Loader2, LogOut, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { adminApiGet, adminApiPost, clearStoredAdminToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface WhitelistUser {
  id: number;
  email: string;
  is_whitelisted: boolean;
  is_active: boolean;
  created_at: string;
}

interface WhitelistUsersPage {
  items: WhitelistUser[];
  total: number;
  page: number;
  page_size: number;
}

async function fetchWhitelistedUsers(page: number, pageSize: number): Promise<WhitelistUsersPage> {
  const res = await adminApiGet(
    `/api/admin/whitelist/users?page=${page}&page_size=${pageSize}`
  );
  if (res.status === 401) {
    clearStoredAdminToken();
    window.location.href = "/admin/login";
    return { items: [], total: 0, page, page_size: pageSize };
  }
  if (!res.ok) throw new Error("Failed to load whitelist users");
  return res.json();
}

export default function AdminWhitelist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [inviteEmail, setInviteEmail] = useState("");

  const {
    data: usersPage,
    isLoading,
    error,
  } = useQuery<WhitelistUsersPage>({
    queryKey: ["/api/admin/whitelist/users", page],
    queryFn: () => fetchWhitelistedUsers(page, pageSize),
  });

  const users = usersPage?.items ?? [];
  const total = usersPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await adminApiPost("/api/admin/whitelist/invite", { email });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Invite failed");
      }
      return data;
    },
    onSuccess: () => {
      toast({ title: "Invite sent", description: "Signup email sent to the driver." });
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/whitelist/users"] });
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
            <h1 className="text-xl font-display font-bold text-white tracking-wider">Whitelist access</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Invite drivers and send signup links.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="email"
                className="flex-1 h-10 rounded-md bg-background border border-white/10 px-3 text-sm text-white placeholder:text-muted-foreground"
                placeholder="driver@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button
                size="sm"
                className="h-10 px-4 font-display uppercase tracking-wider bg-primary text-primary-foreground"
                onClick={() => inviteMutation.mutate(inviteEmail.trim().toLowerCase())}
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Send invite"
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/30 p-4">
              <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">Failed to load whitelist users. You may need to sign in again.</p>
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
          ) : users.length === 0 && !error ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="font-display uppercase tracking-wider text-sm">No whitelisted users</p>
              <p className="text-sm mt-1">Invited drivers will appear here after they create accounts.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-display uppercase tracking-wider text-xs">Email</TableHead>
                  <TableHead className="text-muted-foreground font-display uppercase tracking-wider text-xs">Created</TableHead>
                  <TableHead className="text-muted-foreground font-display uppercase tracking-wider text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="border-white/10">
                    <TableCell className="text-white font-medium">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.is_whitelisted ? (user.is_active ? "Active" : "Disabled") : "Not whitelisted"}
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
