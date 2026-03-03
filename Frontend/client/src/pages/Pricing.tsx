import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          Access the Intelligence
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Currently in closed beta. Unleash the full potential of your simulation rig with our Nurburgring specific AI model.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-card border border-primary/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(225,29,72,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Early Access
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-white mb-2">Pro Driver License</h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold text-white">$29</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Everything you need to master the Green Hell in Assetto Corsa.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {[
              "Nurburgring Nordschleife specific model",
              "Real-time driving coaching & alerts",
              "Live performance scoring for Assetto Corsa",
              "Post-session telemetry & feedback",
              "Personalized setup recommendations"
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl mb-8 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
            <p className="text-xs text-primary/90 leading-relaxed">
              <strong>Beta Restriction:</strong> Only whitelisted accounts can complete the purchase. 
            </p>
          </div>

          {/* Paddle Checkout Placeholder */}
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-display uppercase tracking-widest"
            onClick={() => {
              if (!isAuthenticated) window.location.href = "/login";
              else window.alert("Paddle Checkout Integration Placeholder");
            }}
          >
            {isAuthenticated ? "Subscribe Now" : "Login to Subscribe"}
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            Secure payment powered by Paddle.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
