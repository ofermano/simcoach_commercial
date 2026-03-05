import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge, Mail, ArrowLeft, Loader2, ShieldAlert, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, apiPost, setStoredToken } from "@/lib/api";
import { renderGoogleButton, signInWithGoogle, getGoogleClientId } from "@/lib/google-auth";

type SignupStep = "token-choose" | "token" | "choose" | "email-check" | "need-link" | "create-account" | "already-exists";

export default function Signup() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<SignupStep>("choose");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState(!!getGoogleClientId());
  const tokenGoogleRef = useRef<HTMLDivElement | null>(null);
  const chooseGoogleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/onboarding");
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    apiFetch("/api/auth/providers")
      .then(r => r.json())
      .then(data => setGoogleConfigured(!!(data.google || getGoogleClientId())))
      .catch(() => setGoogleConfigured(!!getGoogleClientId()));
  }, []);

  const renderTokenGoogleButton = (container: HTMLDivElement | null) => {
    if (!container || step !== "token-choose" || !googleConfigured || !token) return;
    renderGoogleButton(container, getGoogleClientId(), async (idToken) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiPost("/api/auth/signup-google-with-token", { token, id_token: idToken });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.detail || data.message || "Google email must match your approved application.");
          return;
        }
        if (data.access_token) setStoredToken(data.access_token);
        toast({ title: "Account created", description: "Welcome to FLOW." });
        window.location.href = "/onboarding";
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }, setError);
  };

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
        toast({ title: "Welcome", description: "You have been signed in." });
        window.location.href = "/onboarding";
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }, setError);
  };

  // Ensure the Google buttons are rendered whenever the relevant step / state changes.
  useEffect(() => {
    if (!tokenGoogleRef.current) return;
    renderTokenGoogleButton(tokenGoogleRef.current);
  }, [step, token, googleConfigured]);

  useEffect(() => {
    if (!chooseGoogleRef.current) return;
    renderChooseGoogleButton(chooseGoogleRef.current);
  }, [step, googleConfigured]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
      setStep("token-choose");
      return;
    }
    const prefillEmail = params.get("email");
    if (prefillEmail) {
      setEmail(prefillEmail);
      setStep("email-check");
    }
    const err = params.get("error");
    if (err === "not_whitelisted") {
      setError("Your email is not on the approved access list. Please request beta access first.");
    } else if (err === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, []);

  const handleCheckEmail = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/auth/check-email", { email: trimmedEmail });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || errData?.message || "Unable to verify email. Please try again.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!data.isWhitelisted) {
        setError("This email is not on the approved access list. Please request beta access first.");
        setLoading(false);
        return;
      }
      if (data.hasAccount) {
        setStep("already-exists");
      } else {
        setStep("need-link");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleSignupWithToken = async () => {
    if (!token || !password || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/auth/signup", { token, password });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.message || "Invalid or expired link. Request a new one below.");
        setLoading(false);
        return;
      }
      if (data.access_token) setStoredToken(data.access_token);
      toast({ title: "Account created", description: "Welcome to FLOW." });
      window.location.href = "/onboarding";
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleResendSignupLink = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/auth/resend-signup-link", { email: trimmedEmail });
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

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold tracking-wider uppercase">Invitation Only</span>
            </div>

            <h1 className="text-2xl font-display font-bold text-white mb-2" data-testid="text-signup-title">
              {step === "token-choose" && "Complete Your Account"}
              {step === "token" && "Set Your Password"}
              {step === "choose" && "Create Your Account"}
              {step === "email-check" && "Enter Your Email"}
              {step === "need-link" && "Get Your Signup Link"}
              {step === "already-exists" && "Account Exists"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {step === "token-choose" && "Choose how to finish signing up"}
              {step === "token" && "Create a password to sign in with email later"}
              {step === "choose" && "You've been invited to join the FLOW beta. Choose how to sign up."}
              {step === "email-check" && "Enter the email address from your invitation"}
              {step === "need-link" && "We'll send you a signup link to set your password"}
              {step === "already-exists" && "An account with this email already exists"}
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
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3" data-testid="text-signup-error">
                  <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "token-choose" && (
              <motion.div
                key="token-choose"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div
                  ref={tokenGoogleRef}
                  className="min-h-[3.5rem] w-full flex items-center justify-center [&>div]:min-h-[3.5rem]"
                  data-testid="container-signup-token-google"
                />
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Completing sign-in…</span>
                  </div>
                )}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-3 text-muted-foreground font-display tracking-wider">or</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-card border border-white/10"
                  variant="outline"
                  onClick={() => { setError(null); setStep("token"); }}
                  disabled={loading}
                  data-testid="button-signup-token-password"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Set password (sign in with email)
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  If Google sign-in is blocked by your browser, use the option above to set a password.
                </p>
              </motion.div>
            )}

            {step === "token" && (
              <motion.div
                key="token"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground -mb-2"
                  onClick={() => setStep("token-choose")}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="signup-password-token" className="text-gray-300 font-display uppercase tracking-wider text-xs">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password-token"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 bg-background border-white/10 focus:border-primary text-white pr-12"
                      data-testid="input-signup-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-token" className="text-gray-300 font-display uppercase tracking-wider text-xs">Confirm Password</Label>
                  <Input
                    id="signup-confirm-token"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSignupWithToken()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white"
                    data-testid="input-signup-confirm-password"
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleSignupWithToken}
                  disabled={loading || !password || !confirmPassword || password.length < 8}
                  data-testid="button-signup-submit"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                </Button>
              </motion.div>
            )}

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
                  data-testid="button-signup-email"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Sign Up with Email
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
                  ref={chooseGoogleRef}
                  className="min-h-[3.5rem] w-full flex items-center justify-center [&>div]:min-h-[3.5rem]"
                  data-testid="container-signup-google"
                />
                {loading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in…</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
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
                  <Label htmlFor="signup-email" className="text-gray-300 font-display uppercase tracking-wider text-xs">Email Address</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="yourname@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white placeholder:text-muted-foreground"
                    autoFocus
                    data-testid="input-signup-email"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleCheckEmail}
                  disabled={loading || !email.trim()}
                  data-testid="button-signup-check-email"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setStep("choose"); }}
                  data-testid="button-signup-back"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to signup options
                </Button>
              </motion.div>
            )}

            {step === "need-link" && (
              <motion.div
                key="need-link"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg px-4 py-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-green-400 font-display uppercase tracking-wider">Approved</p>
                  </div>
                  <p className="text-white text-sm font-medium" data-testid="text-signup-verified-email">{email}</p>
                </div>

                <p className="text-muted-foreground text-sm text-center">
                  We&apos;ll send you a signup link to set your password. Check your email, or request a new link below.
                </p>

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleResendSignupLink}
                  disabled={loading}
                  data-testid="button-signup-resend"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send signup link"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setStep("email-check"); }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Use a different email
                </Button>
              </motion.div>
            )}

            {step === "already-exists" && (
              <motion.div
                key="already-exists"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-secondary/50 rounded-lg px-4 py-3">
                  <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Email</p>
                  <p className="text-white text-sm font-medium" data-testid="text-signup-existing-email">{email}</p>
                </div>

                <p className="text-muted-foreground text-sm text-center">
                  An account with this email already exists. Please sign in instead.
                </p>

                <Link href="/login">
                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                    data-testid="button-signup-go-login"
                  >
                    Go to Login
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => { setError(null); setEmail(""); setStep("email-check"); }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Try a different email
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
