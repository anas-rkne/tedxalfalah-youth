import Link from "next/link";
import SectionContainer from "@/components/ui/SectionContainer";

const STATS = [
  { label: "Speakers", value: "12+" }, // TODO: replace with real figure
  { label: "Attendees", value: "400+" }, // TODO: replace with real figure
  { label: "Activations", value: "5+" }, // TODO: replace with real figure
];

export default function Highlights() {
  return (
    <section className="py-16 md:py-24 bg-tedx-white">
      <SectionContainer>
        <div className="grid md:grid-cols-3 gap-8">
          <Link
            href="/venue"
            className="group block p-8 bg-tedx-gray-light rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-tedx-red">
              The Venue
            </h3>
            <p className="text-sm text-tedx-gray">
              [PLACEHOLDER: short teaser about the venue and why it was
              chosen.]
            </p>
          </Link>

          <Link
            href="/activations"
            className="group block p-8 bg-tedx-gray-light rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-xl font-bold mb-2 group-hover:text-tedx-red">
              Side Activations
            </h3>
            <p className="text-sm text-tedx-gray">
              [PLACEHOLDER: short teaser about the experience beyond the
              talks.]
            </p>
          </Link>

          <div className="p-8 bg-tedx-black text-tedx-white rounded-lg flex flex-col justify-center gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-sm text-tedx-white/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
