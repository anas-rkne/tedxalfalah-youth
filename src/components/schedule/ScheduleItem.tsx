import Link from "next/link";
import { Session } from "@/lib/types";

const TYPE_STYLES: Record<
  Session["type"],
  { label: string; badgeClass: string; borderClass: string }
> = {
  talk: {
    label: "Talk",
    badgeClass: "bg-tedx-red text-tedx-white",
    borderClass: "border-tedx-red",
  },
  break: {
    label: "Break",
    badgeClass: "bg-tedx-gray-light text-tedx-gray",
    borderClass: "border-gray-200",
  },
  activation: {
    label: "Activation",
    badgeClass: "bg-tedx-black text-tedx-white",
    borderClass: "border-tedx-black",
  },
  registration: {
    label: "Registration",
    badgeClass: "bg-tedx-gray-light text-tedx-gray",
    borderClass: "border-gray-200",
  },
};

interface ScheduleItemProps {
  session: Session;
}

export default function ScheduleItem({ session }: ScheduleItemProps) {
  const style = TYPE_STYLES[session.type];

  return (
    <div
      className={`flex flex-col sm:flex-row gap-2 sm:gap-6 border-l-4 ${style.borderClass} bg-tedx-white rounded-r-lg p-4 sm:p-5 shadow-sm`}
    >
      <div className="sm:w-32 flex-shrink-0">
        <p className="font-bold text-sm">
          {session.startTime} – {session.endTime}
        </p>
        {session.location && (
          <p className="text-xs text-tedx-gray mt-0.5">{session.location}</p>
        )}
      </div>

      <div className="flex-1">
        <span
          className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-1 ${style.badgeClass}`}
        >
          {style.label}
        </span>
        <h3 className="font-semibold">{session.title}</h3>
        {session.speakerName && (
          <p className="text-sm text-tedx-red mt-0.5">
            {session.speakerId ? (
              <Link
                href={`/speakers#${session.speakerId}`}
                className="hover:underline"
              >
                {session.speakerName}
              </Link>
            ) : (
              session.speakerName
            )}
          </p>
        )}
        {session.description && (
          <p className="text-sm text-tedx-gray mt-1">{session.description}</p>
        )}
      </div>
    </div>
  );
}
