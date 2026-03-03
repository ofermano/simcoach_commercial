import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge, Loader2, ShieldAlert, Lock, Mail } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiPost } from "@/lib/api";
import { setStoredAdminToken } from "@/lib/api";

type Step = "credentials" | "code";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestCode = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/admin/super-admin/request-code", {
        username: username.trim(),
        password,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Invalid credentials");
        setLoading(false);
        return;
      }
      setStep("code");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/admin/super-admin/verify-code", {
        username: username.trim(),
        code: code.trim(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Invalid or expired code");
        setLoading(false);
        return;
      }
      if (data.access_token) setStoredAdminToken(data.access_token);
      setLocation("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-2xl p-8 md:p-10 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Gauge className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-bold text-2xl tracking-wider text-white">FLOW</span>
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tracking-wider uppercase">Admin</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              {step === "credentials" ? "Admin sign in" : "Enter verification code"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "credentials"
                ? "We'll send a 6-digit code to your admin email"
                : `Code sent to the email for ${username}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="admin-username" className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Username
                  </Label>
                  <Input
                    id="admin-username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestCode()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white placeholder:text-muted-foreground"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Password
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRequestCode()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white"
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleRequestCode}
                  disabled={loading || !username.trim() || !password}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send login code"}
                </Button>
              </motion.div>
            )}

            {step === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3 mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-white">Check your email for the 6-digit code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-code" className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Code
                  </Label>
                  <Input
                    id="admin-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white text-center text-xl tracking-[0.5em]"
                    autoFocus
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleVerifyCode}
                  disabled={loading || code.length !== 6}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & sign in"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setCode(""); setStep("credentials"); }}
                >
                  Use different account
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link href="/" className="hover:text-white transition-colors">Back to home</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
