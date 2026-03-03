import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon, Monitor, Terminal, FileCode2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { useQuestionnaireStatus, useWhitelistCheck } from "@/hooks/use-onboarding";
import { Loader2 } from "lucide-react";

export default function Download() {
  const [, setLocation] = useLocation();
  const { data: wlData, isLoading: wlLoading, isError: wlError } = useWhitelistCheck();
  const isWhitelisted = wlData?.isWhitelisted;
  const { data: qData, isLoading: qLoading } = useQuestionnaireStatus(isWhitelisted);

  useEffect(() => {
    if (!wlLoading && (wlError || !isWhitelisted)) {
      setLocation("/onboarding");
    }
    if (!qLoading && isWhitelisted && !qData?.hasCompleted) {
      setLocation("/onboarding");
    }
  }, [wlLoading, wlError, isWhitelisted, qLoading, qData, setLocation]);

  if (wlLoading || qLoading || !qData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-display tracking-widest uppercase text-sm">
          Preparing your deployment...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Column: Download & Requirements */}
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Deploy FLOW
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              The lightweight background client that connects your Assetto Corsa telemetry directly to our Intelligence Layer.
            </p>
            
            <Button size="lg" className="h-16 px-8 bg-primary hover:bg-primary/90 text-white font-display text-lg tracking-widest uppercase shadow-[0_0_30px_rgba(225,29,72,0.3)]">
              <DownloadIcon className="mr-3 w-6 h-6" />
              Download Installer (v1.0.4)
            </Button>
            <p className="text-xs text-muted-foreground mt-4">Windows 10/11 Only • 45MB</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="text-primary w-6 h-6" />
              <h2 className="text-2xl font-display font-bold text-white">System Requirements</h2>
            </div>
            
            <ul className="space-y-4 text-gray-300">
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-muted-foreground">OS</span>
                <span className="font-medium text-white">Windows 10/11 (64-bit)</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-muted-foreground">Simulator</span>
                <span className="font-medium text-white">Assetto Corsa (v1.16+)</span>
              </li>
              <li className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-muted-foreground">RAM</span>
                <span className="font-medium text-white">4GB Minimum</span>
              </li>
              <li className="flex justify-between pb-2">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium text-white">Stable Broadband</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Right Column: Instructions */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-white/5 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="text-primary w-6 h-6" />
            <h2 className="text-2xl font-display font-bold text-white">Install Instructions</h2>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {[
              {
                step: "1",
                title: "Run the Installer",
                desc: "Execute FLOW_Setup.exe and follow the wizard. It will automatically detect your Assetto Corsa installation path."
              },
              {
                step: "2",
                title: "Launch Content Manager",
                desc: "Ensure telemetry output is enabled in Content Manager settings (Settings > Assetto Corsa > Apps)."
              },
              {
                step: "3",
                title: "Authenticate Client",
                desc: "Open the FLOW desktop app and log in using your credentials to sync your cloud profile."
              },
              {
                step: "4",
                title: "Hit the Track",
                desc: "Join the Nordschleife. The coaching overlay will automatically engage once you leave the pits."
              }
            ].map((item, i) => (
              <div key={i} className="relative flex items-start gap-6">
                <div className="w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center font-display font-bold text-lg text-primary z-10 shrink-0 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/20 text-center">
            <FileCode2 className="w-8 h-8 text-primary mx-auto mb-3" />
            <h4 className="text-white font-bold mb-2">Need Help?</h4>
            <p className="text-sm text-muted-foreground mb-4">Check our troubleshooting guide or contact engineering.</p>
            <Link href="/support">
              <Button variant="outline" className="border-primary/50 text-white hover:bg-primary/20">
                Go to Support
              </Button>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
