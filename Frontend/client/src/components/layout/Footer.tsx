import { Link } from "wouter";
import { Gauge } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-white/10 bg-background/50 backdrop-blur-md mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 inline-flex">
              <Gauge className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-xl tracking-wider text-white">
                FLOW
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm">
              The Intelligence Layer for Human Driving. Modeling behavior, measuring performance, and guiding drivers to perfection.
            </p>
          </div>
          
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/download" className="hover:text-primary transition-colors">Download</Link></li>
              <li><Link href="/support" className="hover:text-primary transition-colors">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/refund" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              <li><Link href="/legal/data" className="hover:text-primary transition-colors">Data Usage</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {currentYear} FLOW Intelligence. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Built for Assetto Corsa</p>
        </div>
      </div>
    </footer>
  );
}
