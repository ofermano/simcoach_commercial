import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gauge, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { Link } from "wouter";
import { apiPost } from "@/lib/api";

type BetaStep = "form" | "success";

export default function JoinBeta() {
  const [step, setStep] = useState<BetaStep>("form");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiPost("/api/whitelist/apply", { email: trimmedEmail });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || data.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Unable to connect. Please try again later.");
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

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div key="form-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-2xl font-display font-bold text-white mb-2" data-testid="text-beta-title">
                    Join the Beta
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Request early access to the FLOW Intelligence Layer. We'll notify you when a spot opens up.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="success-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-white mb-2" data-testid="text-beta-success">
                    You're on the List
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {error && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-start gap-3" data-testid="text-beta-error">
                    <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="beta-email" className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Email Address
                  </Label>
                  <Input
                    id="beta-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="h-14 bg-background border-white/10 focus:border-primary text-white placeholder:text-muted-foreground"
                    autoFocus
                    data-testid="input-beta-email"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full h-14 text-base font-display uppercase tracking-wider bg-primary text-primary-foreground"
                  onClick={handleSubmit}
                  disabled={loading || !email.trim()}
                  data-testid="button-beta-submit"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Access"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Already have access?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Sign in here
                  </Link>
                </p>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-secondary/50 rounded-lg px-5 py-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">We received your request for</p>
                  <p className="text-white font-medium" data-testid="text-beta-confirmed-email">{email}</p>
                </div>

                <p className="text-muted-foreground text-sm text-center leading-relaxed">
                  Your email has been added to the waitlist. If you are selected for the FLOW beta program, we will send you an invitation with login instructions.
                </p>

                <div className="flex flex-col gap-3">
                  <Link href="/">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-12 font-display uppercase tracking-wider border-white/10"
                      data-testid="button-beta-back-home"
                    >
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
