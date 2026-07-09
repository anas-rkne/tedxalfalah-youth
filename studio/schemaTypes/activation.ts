import { defineField, defineType } from "sanity";

export default defineType({
  name: "activation",
  title: "Activation",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      description: "50 to 80 words",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "locationInVenue",
      title: "Location in Venue",
      type: "string",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "locationInVenue", media: "image" },
  },
});
