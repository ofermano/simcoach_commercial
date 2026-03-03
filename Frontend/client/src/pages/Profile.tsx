import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuestionnaireStatus, useSubmitQuestionnaire, useWhitelistCheck } from "@/hooks/use-onboarding";

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

export default function Profile() {
  const { toast } = useToast();
  const { data: wlData, isLoading: wlLoading, isError: wlError } = useWhitelistCheck();
  const isWhitelisted = wlData?.isWhitelisted;
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitMutation.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Profile updated",
          description: "Your driving profile has been saved.",
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: err.message,
        });
      },
    });
  };

  if (wlLoading || qLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-display tracking-widest uppercase text-sm">
          Loading profile...
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
            Your account is not currently on the beta whitelist. Profiles are only available to
            whitelisted drivers.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel rounded-3xl p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/30 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">Driver Profile</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Calibration Profile
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Update how FLOW interprets your telemetry in Assetto Corsa. Changes here will be
            reflected in future coaching sessions.
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
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Driving Level
                  </FormLabel>
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
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Primary Goal
                  </FormLabel>
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
                  <FormLabel className="text-gray-300 font-display uppercase tracking-wider text-xs">
                    Driving Style
                  </FormLabel>
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
              {submitMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}

