import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge, Mail, ArrowLeft, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { apiFetch, apiPost, setStoredToken } from "@/lib/api";
import { renderGoogleButton, getGoogleClientId } from "@/lib/google-auth";

type LoginStep = "choose" | "email-check" | "password" | "register";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<LoginStep>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/onboarding");
    }
  }, [isAuthenticated, setLocation]);

  const [googleConfigured, setGoogleConfigured] = useState(!!getGoogleClientId());

  const renderChooseGoogleButton = (container: HTMLDivElement | null) => {
    if (!container || step !== "choose" || !googleConfigured) return;
    renderGoogleButton(container, getGoogleClientId(), async (idToken) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiPost("/api/auth/google", { id_token: idToken });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.detail || data.message || "Google sign-in failed.");
          return;
        }
        if (data.access_token) setStoredToken(data.access_token);
        toast({ title: "Welcome back", description: "You have been logged in successfully." });
        window.location.href = "/onboarding";
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }, setError);
  };

  useEffect(() => {
    apiFetch("/api/auth/providers")
      .then(r => r.json())
      .then(data => setGoogleConfigured(!!(data.google || getGoogleClientId())))
      .catch(() => setGoogleConfigured(!!getGoogleClientId()));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "not_whitelisted") {
      setError("Your email is not on the approved access list. Contact us to request access.");
    } else if (err === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, []);

  const handleCheckEmail = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/auth/check-email", { email: email.trim().toLowerCase() });
      const data = await res.json().catch(() => ({}));
      if (!data.isWhitelisted) {
        setError("This email is not on the approved access list. Contact us to request access.");
        setLoading(false);
        return;
      }
      if (data.hasAccount) {
        setStep("password");
      } else {
        setStep("register");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/auth/login", { email: email.trim().toLowerCase(), password });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Invalid credentials");
        setLoading(false);
        return;
      }
      if (data.access_token) setStoredToken(data.access_token);
      toast({ title: "Welcome back", description: "You have been logged in successfully." });
      window.location.href = "/onboarding";
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleResendSignupLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/auth/resend-signup-link", { email: email.trim().toLowerCase() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Could not send link.");
        setLoading(false);
        return;
      }
      toast({ title: "Link sent", description: data.message || "Check your email for the signup link." });
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
            <h1 className="text-2xl font-display font-bold text-white mb-2" data-testid="text-login-title">
              {step === "choose" && "Driver Access"}
              {step === "email-check" && "Enter Your Email"}
              {step === "password" && "Welcome Back"}
              {step === "register" && "Create Account"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "choose" && "Sign in to access the Intelligence Layer"}
              {step === "email-check" && "We'll check if you're on the access list"}
              {step === "password" && "Enter your password to continue"}
              {step === "register" && "Set up your credentials to get started"}
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
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3" data-testid="text-login-error">
                  <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "choose" && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-card border border-white/10"
                  variant="outline"
                  onClick={() => { setError(null); setStep("email-check"); }}
                  data-testid="button-login-email"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Continue with Email
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-display tracking-wider">or</span>
                  </div>
                </div>

                <div
                  ref={(el) => el && renderChooseGoogleButton(el)}
                  className="min-h-[3.5rem] w-full flex items-center justify-center [&>div]:min-h-[3.5rem]"
                  data-testid="container-login-google"
                />
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </div>
                )}
              </motion.div>
            )}

            {step === "email-check" && (
              <motion.div
                key="email-check"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300 font-display uppercase tracking-wider text-xs">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="driver@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white placeholder:text-muted-foreground"
                    autoFocus
                    data-testid="input-email"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleCheckEmail}
                  disabled={loading || !email.trim()}
                  data-testid="button-check-email"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setStep("choose"); }}
                  data-testid="button-back-to-choose"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login options
                </Button>
              </motion.div>
            )}

            {step === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-secondary/50 rounded-lg px-4 py-3 mb-2">
                  <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Signing in as</p>
                  <p className="text-white text-sm font-medium" data-testid="text-login-email">{email}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 font-display uppercase tracking-wider text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="h-14 bg-background border-white/10 focus:border-primary text-white pr-12"
                      autoFocus
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleLogin}
                  disabled={loading || !password}
                  data-testid="button-login-submit"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setPassword(""); setStep("email-check"); }}
                  data-testid="button-back-to-email"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Use a different email
                </Button>
              </motion.div>
            )}

            {step === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-secondary/50 rounded-lg px-4 py-3 mb-2">
                  <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Approved email</p>
                  <p className="text-white text-sm font-medium" data-testid="text-register-email">{email}</p>
                </div>

                <p className="text-muted-foreground text-sm text-center">
                  You&apos;re approved but haven&apos;t set a password yet. Use the signup link from your invitation email to create your password.
                </p>

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleResendSignupLink}
                  disabled={loading}
                  data-testid="button-resend-signup-link"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Resend signup link"}
                </Button>

                <Link href="/signup">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12 font-display uppercase tracking-wider border-white/10"
                    data-testid="button-go-signup"
                  >
                    I have a signup link
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setStep("email-check"); }}
                  data-testid="button-back-to-email-register"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Use a different email
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
