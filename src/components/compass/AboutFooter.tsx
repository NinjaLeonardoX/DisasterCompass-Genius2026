import { Link } from "@tanstack/react-router";

export function AboutFooter() {
  return (
    <footer className="rounded-2xl border border-border bg-surface p-5 text-sm text-foreground/75">
      <p>
        Disaster Compass complements official alerts and emergency services; it does not replace 911.
        Actions and routes are rules-based and explainable. AI only phrases guidance. In a real
        emergency, follow local officials and call emergency services for life-threatening
        situations. This hackathon demo uses seeded data for one fictional neighborhood.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-medium">
        <Link to="/methodology" className="text-primary hover:underline">
          Methodology
        </Link>
        <Link to="/ai-disclosure" className="text-primary hover:underline">
          AI Disclosure
        </Link>
      </div>
    </footer>
  );
}
