import { defineField, defineType } from "sanity";

export default defineType({
  name: "eventInfo",
  title: "Event Info",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Event Title",
      type: "string",
    }),
    defineField({
      name: "date",
      title: "Event Date",
      description: "The date of the event (e.g. 2026-12-19)",
      type: "date",
      options: {
        dateFormat: "YYYY-MM-DD",
      },
    }),
    defineField({
      name: "venue",
      title: "Venue",
      type: "string",
    }),
    defineField({
      name: "showSpeakers",
      title: "Show Speakers Section (Homepage)",
      description:
        "Turn ON to show the Speakers section on the homepage. The Speakers page always opens and shows a 'coming soon' message until speakers are published.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "showSponsors",
      title: "Show Sponsors Section (Homepage)",
      description:
        "Turn ON to show the Sponsors section on the homepage once partners are confirmed.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "showTeam",
      title: "Show Team Section (Homepage)",
      description:
        "Turn ON to show the Team section on the homepage. The Team page always opens and shows a 'coming soon' message until members are published.",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
});
