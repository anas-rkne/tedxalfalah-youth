import SectionHeader from "@/components/shared/SectionHeader";
import FadeInView from "@/components/ui/FadeInView";

export interface ApplyTimelineStep {
  title: string;
  description: string;
}

interface ApplyTimelineProps {
  label: string;
  title: string;
  subtitle: string;
  videoLabel: string;
  steps: ApplyTimelineStep[];
}

export default function ApplyTimeline({
  label,
  title,
  subtitle,
  videoLabel,
  steps,
}: ApplyTimelineProps) {
  return (
    <div>
      <FadeInView>
        <SectionHeader label={label} title={title} />
        <p className="text-[15px] text-muted-foreground leading-[1.8] text-center max-w-xl mx-auto -mt-7 mb-10">
          {subtitle}
        </p>
      </FadeInView>

      <div className="grid md:grid-cols-2 gap-5">
        {steps.map((step, i) => (
          <FadeInView key={i} delay={0.05 + i * 0.1}>
            <article className="group relative h-full p-8 rounded-[28px] bg-card border border-border overflow-hidden hover:border-tedx-red/20 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]">
              <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-[600ms] pointer-events-none" style={{ background: "radial-gradient(circle at 50% 0%, rgba(230,43,30,0.04), transparent 50%)" }} />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-xs font-bold tracking-[0.25em] text-tedx-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="w-10 h-10 rounded-full flex items-center justify-center bg-tedx-red/10 border border-border text-tedx-red font-bold text-sm">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-xl text-foreground tracking-[-0.02em] mb-2 group-hover:text-tedx-red transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-[1.8] mb-6">
                  {step.description}
                </p>
                <div className="mt-auto relative aspect-video rounded-2xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center gap-3 text-center px-6">
                    <span className="w-12 h-12 rounded-full bg-tedx-red/10 border border-tedx-red/20 flex items-center justify-center text-tedx-red">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{videoLabel}</span>
                  </div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-tedx-red/5 rounded-full blur-2xl pointer-events-none" />
                </div>
              </div>
              <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 origin-left transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ background: "linear-gradient(90deg, #e62b1e, #f97316, transparent)" }} />
            </article>
          </FadeInView>
        ))}
      </div>
    </div>
  );
}