import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Gauge, Loader2, LogOut, ShieldAlert, Search, UserCircle2 } from "lucide-react";
import { Link } from "wouter";
import { adminApiGet, clearStoredAdminToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AdminQuestionnaireUser {
  user_id: number;
  email: string;
  display_name: string | null;
  drivingLevel: string;
  goal: string;
  drivingStyle: string;
  latestAt: string;
}

interface AdminQuestionnaireItem {
  displayName: string;
  drivingLevel: string;
  goal: string;
  drivingStyle: string;
  createdAt: string;
}

interface AdminQuestionnaireDetail {
  user_id: number;
  email: string;
  display_name: string | null;
  responses: AdminQuestionnaireItem[];
}

interface AdminQuestionnaireUsersPage {
  items: AdminQuestionnaireUser[];
  total: number;
  page: number;
  page_size: number;
}

async function fetchUsers(page: number, pageSize: number): Promise<AdminQuestionnaireUsersPage> {
  const res = await adminApiGet(
    `/api/admin/questionnaires/users?page=${page}&page_size=${pageSize}`
  );
  if (res.status === 401) {
    clearStoredAdminToken();
    window.location.href = "/admin/login";
    return { items: [], total: 0, page, page_size: pageSize };
  }
  if (!res.ok) throw new Error("Failed to load questionnaire users");
  return res.json();
}

async function fetchUserDetail(userId: number): Promise<AdminQuestionnaireDetail> {
  const res = await adminApiGet(`/api/admin/questionnaires/${userId}`);
  if (res.status === 401) {
    clearStoredAdminToken();
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("Failed to load questionnaire detail");
  return res.json();
}

export default function AdminProfiles() {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data: usersPage,
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery<AdminQuestionnaireUsersPage>({
    queryKey: ["/api/admin/questionnaires/users", page],
    queryFn: () => fetchUsers(page, pageSize),
  });

  const {
    data: detail,
    isLoading: loadingDetail,
    error: detailError,
  } = useQuery<AdminQuestionnaireDetail>({
    queryKey: ["/api/admin/questionnaires/detail", selectedUserId],
    queryFn: () => fetchUserDetail(selectedUserId as number),
    enabled: selectedUserId != null,
  });

  const handleLogout = () => {
    clearStoredAdminToken();
    window.location.href = "/admin/login";
  };

  const allUsers = usersPage?.items ?? [];
  const total = usersPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => {
      const email = u.email.toLowerCase();
      const name = (u.display_name || "").toLowerCase();
      return email.includes(q) || name.includes(q);
    });
  }, [allUsers, search]);

  const formatDateTime = (s: string) => {
    try {
      return new Date(s).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return s;
    }
  };

  const activeUser =
    detail && selectedUserId != null && detail.user_id === selectedUserId ? detail : null;

  if (usersError) {
    toast({
      title: "Error",
      description: "Failed to load questionnaire users. You may need to sign in again.",
      variant: "destructive",
    });
  }

  if (detailError) {
    toast({
      title: "Error",
      description: "Failed to load questionnaire detail.",
      variant: "destructive",
    });
  }

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
                <span className="font-display font-bold text-xl tracking-wider text-white">
                  FLOW Admin
                </span>
              </Link>
              <span className="text-muted-foreground text-sm font-display uppercase tracking-wider">
                Profiles
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-muted-foreground hover:text-white"
                >
                  Whitelist
                </Button>
              </Link>
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
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-panel rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-display font-bold text-white tracking-wider">
                Driver profiles
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Search for a driver to view their display name and questionnaire history.
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or display name"
                className="h-10 w-full rounded-md bg-background border border-white/10 pl-9 pr-3 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-white/10">
            {/* Left: user list */}
            <div className="border-r border-white/10 max-h-[480px] overflow-y-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-10 px-6 text-center text-muted-foreground text-sm">
                  {allUsers.length === 0 ? "No profiles yet." : "No matches found."}
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const isActive = u.user_id === selectedUserId;
                      return (
                        <TableRow
                          key={u.user_id}
                          className={`cursor-pointer border-white/10 hover:bg-white/5 ${
                            isActive ? "bg-white/10" : ""
                          }`}
                          onClick={() => setSelectedUserId(u.user_id)}
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <UserCircle2 className="w-5 h-5 text-primary" />
                              </div>
                              <div className="space-y-0.5">
                                <div className="text-sm font-medium text-white truncate">
                                  {u.display_name || u.email}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {u.email}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {formatDateTime(u.latestAt)}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Pagination */}
              {!loadingUsers && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-muted-foreground">
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
            </div>

            {/* Right: detail */}
            <div className="md:col-span-2 p-6 space-y-6">
              {!activeUser ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3">
                  <UserCircle2 className="w-10 h-10 text-muted-foreground" />
                  <p className="text-sm">
                    Select a driver on the left to view their profile and questionnaire history.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg font-display font-bold text-white">
                            {activeUser.display_name || activeUser.email}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activeUser.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    {activeUser.responses.length > 0 && (
                      <div className="text-xs text-muted-foreground text-right">
                        <div>Responses: {activeUser.responses.length}</div>
                        <div>
                          Latest: {formatDateTime(activeUser.responses[0].createdAt)}
                        </div>
                      </div>
                    )}
                  </div>

                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : activeUser.responses.length === 0 ? (
                    <div className="py-8 text-sm text-muted-foreground">
                      No questionnaire responses recorded for this driver.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-sm font-display uppercase tracking-wider text-muted-foreground">
                        Questionnaire history
                      </h3>
                      <div className="space-y-3">
                        {activeUser.responses.map((r, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-background/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                          >
                            <div className="space-y-1 text-sm">
                              <div className="text-xs text-muted-foreground">
                                {formatDateTime(r.createdAt)}
                              </div>
                              <div className="text-white">
                                <span className="text-muted-foreground mr-1.5">
                                  Display name:
                                </span>
                                <span>{r.displayName}</span>
                              </div>
                              <div className="text-white">
                                <span className="text-muted-foreground mr-1.5">
                                  Driving level:
                                </span>
                                <span className="capitalize">{r.drivingLevel}</span>
                              </div>
                              <div className="text-white">
                                <span className="text-muted-foreground mr-1.5">Goal:</span>
                                <span>{r.goal}</span>
                              </div>
                              <div className="text-white">
                                <span className="text-muted-foreground mr-1.5">
                                  Driving style:
                                </span>
                                <span>{r.drivingStyle}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

