import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileWarning, LifeBuoy, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Support() {
  const { toast } = useToast();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Transmission Sent",
      description: "Support ticket generated. We will respond within 24 hours.",
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          Engineering Support
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Troubleshoot issues, send telemetry logs, or reach out to our team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Col: FAQ & Logs */}
        <div className="lg:col-span-7 space-y-12">
          
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <LifeBuoy className="text-primary w-6 h-6" />
              Frequently Asked Questions
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "Why is the app only for Nurburgring?",
                  a: "Our AI model requires millions of miles of telemetry to build an accurate coaching layer. We decided to hyper-focus on the most demanding track in the world first before expanding."
                },
                {
                  q: "Overlay is not appearing in-game",
                  a: "Ensure you are running Assetto Corsa in Borderless Windowed mode. Exclusive Fullscreen blocks external overlays. Also check that FLOW is running as Administrator."
                },
                {
                  q: "Audio alerts are delayed",
                  a: "Check your network latency. The telemetry is processed in real-time on our servers. A ping >80ms may result in slightly delayed audio cues."
                },
                {
                  q: "How do I cancel my subscription?",
                  a: "You can manage your subscription via the Paddle integration on the Pricing page once logged in."
                }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-white/10">
                  <AccordionTrigger className="text-left text-gray-200 hover:text-white hover:no-underline font-medium py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-white/5 rounded-2xl p-8"
          >
            <h2 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-3">
              <FileWarning className="text-primary w-5 h-5" />
              Send Telemetry Logs
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              If the client crashes, sending your logs helps us fix the issue faster.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 bg-background/50 p-4 rounded-lg font-mono">
              <li>Open File Explorer</li>
              <li>Navigate to <span className="text-primary">%AppData%/FLOW/logs/</span></li>
              <li>Zip the latest <code>crash_dump.log</code></li>
              <li>Attach it via the contact form</li>
            </ol>
          </motion.section>
        </div>

        {/* Right Col: Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-5"
        >
          <div className="glass-panel p-8 rounded-3xl sticky top-24">
            <h2 className="text-2xl font-display font-bold text-white mb-6">Contact Team</h2>
            <form onSubmit={handleContactSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Driver Name</Label>
                <Input 
                  id="name" 
                  required 
                  className="bg-background border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white" 
                  placeholder="Max Verstappen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  className="bg-background border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white" 
                  placeholder="driver@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue" className="text-gray-300">Issue Category</Label>
                <select 
                  id="issue"
                  className="flex h-10 w-full rounded-md bg-background border border-white/10 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option>Technical Issue / Bug</option>
                  <option>Account / Billing</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">Message</Label>
                <Textarea 
                  id="message" 
                  required 
                  rows={5}
                  className="bg-background border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white resize-none" 
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-display tracking-widest uppercase">
                <Send className="mr-2 w-4 h-4" />
                Transmit Request
              </Button>
            </form>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
