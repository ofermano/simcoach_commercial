import { useRoute } from "wouter";

const LEGAL_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    date: "Last Updated: October 2023",
    body: "FLOW respects your privacy. We collect telemetry data solely for the purpose of modeling your driving behavior and providing coaching. We do not sell your personal identifying data to third parties. Telemetry data may be used in aggregate to improve our core intelligence models."
  },
  terms: {
    title: "Terms of Service",
    date: "Last Updated: October 2023",
    body: "By using FLOW, you agree not to reverse engineer, decompile, or extract the proprietary models or coaching logic from the client. FLOW is provided 'as is' for simulation purposes only and should not be relied upon for real-world track driving safety."
  },
  refund: {
    title: "Refund Policy",
    date: "Last Updated: October 2023",
    body: "We offer a 14-day money-back guarantee for your first subscription charge. If the client does not work on your system, please contact support for troubleshooting. If the issue cannot be resolved, a full refund will be issued via Paddle."
  },
  data: {
    title: "Data Usage Disclosure",
    date: "Last Updated: October 2023",
    body: "The FLOW client reads real-time memory states from Assetto Corsa to determine speed, positioning, inputs, and track location. This data is transmitted securely to our servers where it is processed by our AI layer. You can request deletion of your telemetry history at any time through the support portal."
  }
};

export default function Legal() {
  const [match, params] = useRoute("/legal/:page");
  
  if (!match) return null;
  
  const pageId = params?.page as keyof typeof LEGAL_CONTENT;
  const content = LEGAL_CONTENT[pageId];

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-display font-bold text-white mb-4">Document Not Found</h1>
        <p className="text-muted-foreground">The requested legal document does not exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <div className="glass-panel p-8 md:p-12 rounded-3xl">
        <h1 className="text-4xl font-display font-bold text-white mb-2">{content.title}</h1>
        <p className="text-sm text-primary mb-10 font-mono">{content.date}</p>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed text-lg">
            {content.body}
          </p>
          
          {/* Placeholder for long legal text */}
          <h3 className="text-white mt-8 mb-4 font-display">1. Information We Collect</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est.
          </p>

          <h3 className="text-white mt-8 mb-4 font-display">2. How We Use Information</h3>
          <p className="text-gray-300 leading-relaxed mb-6">
            Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque egestas augue, eu vulputate magna eros eu erat.
          </p>
        </div>
      </div>
    </div>
  );
}
