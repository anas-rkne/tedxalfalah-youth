interface TimelineStage {
  stageNumber: number;
  title: string;
  dateLabel: string;
  description: string;
}

// TODO: replace dateLabel values with real dates once confirmed by client
const STAGES: TimelineStage[] = [
  {
    stageNumber: 1,
    title: "Applications Open",
    dateLabel: "[Date]",
    description: "Submit your application through the form below.",
  },
  {
    stageNumber: 2,
    title: "Applications Close",
    dateLabel: "[Date]",
    description: "Final day to submit your application.",
  },
  {
    stageNumber: 3,
    title: "Screening of Applications",
    dateLabel: "[Date range]",
    description: "Our review community reads every application.",
  },
  {
    stageNumber: 4,
    title: "Shortlisting Announced",
    dateLabel: "[Date]",
    description: "Shortlisted applicants are notified by email.",
  },
  {
    stageNumber: 5,
    title: "First Interview",
    dateLabel: "[Date range]",
    description: "A short conversation to explore your idea further.",
  },
  {
    stageNumber: 6,
    title: "Confirmation of Progression",
    dateLabel: "[Date]",
    description: "You'll hear if you're moving to the next round.",
  },
  {
    stageNumber: 7,
    title: "Second Interview",
    dateLabel: "[Date range]",
    description: "A deeper look at your talk idea and readiness.",
  },
  {
    stageNumber: 8,
    title: "Final Speaker Selection Announced",
    dateLabel: "[Date]",
    description: "Final speakers are confirmed and notified.",
  },
  {
    stageNumber: 9,
    title: "Coaching and Talk Development",
    dateLabel: "[Date range]",
    description: "Selected speakers work with coaches to shape their talk.",
  },
  {
    stageNumber: 10,
    title: "Rehearsals",
    dateLabel: "[Date range]",
    description: "Practice sessions ahead of event day.",
  },
  {
    stageNumber: 11,
    title: "Event Day",
    dateLabel: "[Date]",
    description: "TEDxAlFalah Youth takes the stage.",
  },
];

export default function ApplicationTimeline() {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex flex-col md:flex-row md:min-w-[1400px] gap-8 md:gap-0">
        {STAGES.map((stage, index) => (
          <div
            key={stage.stageNumber}
            className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 md:flex-1 relative"
          >
            {/* connector line */}
            {index < STAGES.length - 1 && (
              <div className="hidden md:block absolute top-4 left-1/2 w-full h-px bg-gray-300" />
            )}

            <div className="flex-shrink-0 relative z-10 w-8 h-8 rounded-full bg-tedx-red text-tedx-white flex items-center justify-center text-sm font-bold">
              {stage.stageNumber}
            </div>

            <div className="md:mt-4 md:text-center md:px-2">
              <h3 className="font-semibold text-sm">{stage.title}</h3>
              <p className="text-xs text-tedx-red mb-1">{stage.dateLabel}</p>
              <p className="text-xs text-tedx-gray">{stage.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
