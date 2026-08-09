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
      description: "The date of the event (e.g. 2026-11-15)",
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
      title: "Show Speakers Section",
      description:
        "Turn ON to make the Speakers section and page visible once the lineup is ready.",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "date" },
  },
});
