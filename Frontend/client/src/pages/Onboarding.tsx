import { useWhitelistCheck, useQuestionnaireStatus, useSubmitQuestionnaire } from "@/hooks/use-onboarding";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert, CheckCircle2, Gauge, Brain, Activity, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const FAKE_STATS = [
  { label: "Laps analyzed (AC)", value: "2.4M+", sub: "Human telemetry", icon: Gauge },
  { label: "HI score", value: "94%", sub: "Human intelligence", icon: Brain },
  { label: "Drivers calibrated", value: "12.8K", sub: "Assetto Corsa", icon: Activity },
  { label: "Model accuracy", value: "98.2%", sub: "Pace prediction", icon: Zap },
];

const formSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters"),
  drivingLevel: z.enum(["beginner", "intermediate", "professional"], {
    required_error: "Please select a driving level",
  }),
  goal: z.enum(["Fast", "Accurate"], {
    required_error: "Please select your primary goal",
  }),
  drivingStyle: z.enum(["Aggressive", "Smooth", "Adaptive"], {
    required_error: "Please select your driving style",
  }),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: whitelistData, isLoading: wlLoading, isError: wlError } = useWhitelistCheck();
  const isWhitelisted = whitelistData?.isWhitelisted;
  
  const { data: qData, isLoading: qLoading } = useQuestionnaireStatus(isWhitelisted);
  const submitMutation = useSubmitQuestionnaire();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      drivingLevel: undefined,
      goal: undefined,
      drivingStyle: undefined,
    } as any,
  });

  useEffect(() => {
    if (qData?.latest) {
      form.reset({
        displayName: qData.latest.displayName,
        drivingLevel: qData.latest.drivingLevel as any,
        goal: qData.latest.goal as any,
        drivingStyle: qData.latest.drivingStyle as any,
      });
    }
  }, [qData, form]);

  // If questionnaire already completed, send driver straight to download
  useEffect(() => {
    if (qData?.hasCompleted) {
      setLocation("/download");
    }
  }, [qData, setLocation]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitMutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Profile Configured",
          description: "Your driving profile has been saved. Initializing download protocol...",
        });
        setLocation("/download");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: err.message,
        });
      }
    });
  };

  if (wlLoading || qLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-display tracking-widest uppercase text-sm">
          Checking clearance levels...
        </p>
      </div>
    );
  }

  if (wlError || !isWhitelisted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-destructive/30 rounded-2xl p-8 md:p-12 shadow-[0_0_40px_rgba(220,38,38,0.15)]"
        >
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-8">
            Your account is not currently on the beta whitelist. The FLOW Intelligence Layer is currently operating in a closed environment.
          </p>
          <Button variant="outline" onClick={() => window.history.back()} className="border-white/10 hover:bg-white/5">
            Return to Safety
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Stats: Human Intelligence for Assetto Corsa (fake) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          {FAKE_STATS.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center md:text-left"
            >
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <stat.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-display font-bold text-white tabular-nums">
                {stat.value}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </motion.div>

        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 mb-6">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">Clearance Granted</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Driver Calibration
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Configure your baseline parameters so the Human Intelligence layer adapts to your Assetto Corsa telemetry faster.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Display name
                  </FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      type="text"
                      placeholder="How should we call you in the garage?"
                      className="h-14 w-full rounded-md bg-background border border-white/10 px-4 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="drivingLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">Driving Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 bg-background border-white/10 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Select your experience level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-white/10 text-white">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">Primary Goal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 bg-background border-white/10 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Select your objective" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-white/10 text-white">
                      <SelectItem value="Fast">Fast (Raw Pace)</SelectItem>
                      <SelectItem value="Accurate">Accurate (Consistency)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="drivingStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">Driving Style</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-14 bg-background border-white/10 focus:ring-primary focus:border-primary">
                        <SelectValue placeholder="Select your approach" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-white/10 text-white">
                      <SelectItem value="Aggressive">Aggressive</SelectItem>
                      <SelectItem value="Smooth">Smooth</SelectItem>
                      <SelectItem value="Adaptive">Adaptive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-destructive" />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 text-lg font-display uppercase tracking-widest bg-primary hover:bg-primary/90"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Calibrating..." : "Initialize Telemetry"}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
