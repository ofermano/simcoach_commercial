import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Activity, Cpu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32">
        {/* landing page hero fast sports car track night */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=2400&q=80&fit=crop" 
            alt="Racing background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold tracking-wider uppercase">Assetto Corsa Compatible</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6">
                The <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50 text-glow">Intelligence Layer</span><br />
                For Human Driving
              </h1>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
                FLOW builds Artificial Driving Intelligence that models behavior, measures performance, and guides human drivers across simulation and real-world environments.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Link href="/onboarding">
                    <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-display uppercase tracking-wider bg-primary text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]">
                      Access Dashboard
                      <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/join">
                      <Button 
                        size="lg" 
                        className="w-full sm:w-auto h-14 px-8 text-lg font-display uppercase tracking-wider bg-primary text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                        data-testid="button-join-beta"
                      >
                        Join Beta
                        <ChevronRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-display uppercase tracking-wider border-white/20">
                        Driver Login
                      </Button>
                    </Link>
                  </>
                )}
                
                <Link href="/pricing">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-display uppercase tracking-wider border-white/20">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-secondary/30 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Precision Engineering</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Elevate your lap times with real-time telemetry and AI-driven coaching designed for the Nurburgring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Activity className="w-8 h-8 text-primary" />,
                title: "Real-Time Alerts",
                desc: "Get split-second feedback on your braking points, racing line, and throttle application while driving."
              },
              {
                icon: <Target className="w-8 h-8 text-primary" />,
                title: "Performance Scoring",
                desc: "Post-session deep dives into your lap. See exactly where you lost time and how to recover it."
              },
              {
                icon: <Cpu className="w-8 h-8 text-primary" />,
                title: "AI Coaching",
                desc: "Our proprietary AI models your unique driving style to provide personalized, actionable advice."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group tech-border"
              >
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
