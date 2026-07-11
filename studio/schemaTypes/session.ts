import { defineField, defineType } from "sanity";

export default defineType({
  name: "session",
  title: "Schedule Session",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Talk", value: "talk" },
          { title: "Break", value: "break" },
          { title: "Activation", value: "activation" },
          { title: "Registration", value: "registration" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Start Time",
      description: "Format: HH:MM (24-hour), e.g. 09:15",
      type: "string",
      validation: (Rule) =>
        Rule.required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
          name: "HH:MM 24-hour time",
        }),
    }),
    defineField({
      name: "endTime",
      title: "End Time",
      description: "Format: HH:MM (24-hour), e.g. 09:35",
      type: "string",
      validation: (Rule) =>
        Rule.required().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
          name: "HH:MM 24-hour time",
        }),
    }),
    defineField({
      name: "speaker",
      title: "Speaker",
      description: "Only relevant for sessions of type 'Talk'",
      type: "reference",
      to: [{ type: "speaker" }],
    }),
    defineField({
      name: "location",
      title: "Location",
      description: "e.g. 'Main Stage', 'East Hall'",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      description: "Optional, mainly used for breaks/activations",
      type: "text",
    }),
  ],
  orderings: [
    {
      title: "Start Time",
      name: "startTimeAsc",
      by: [{ field: "startTime", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", subtitle: "startTime" },
  },
});
