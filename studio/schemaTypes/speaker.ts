import { defineField, defineType } from "sanity";

export default defineType({
  name: "speaker",
  title: "Speaker",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Full Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "shortDescriptor",
      title: "Short Descriptor",
      description: "e.g. 'student innovator', 'poet', 'entrepreneur'",
      type: "string",
    }),
    defineField({
      name: "talkTitle",
      title: "Talk Title",
      type: "string",
    }),
    defineField({
      name: "themeConnection",
      title: "Connection to the Event Theme",
      description: "One line describing how this talk connects to the theme",
      type: "string",
    }),
    defineField({
      name: "bio",
      title: "Biography",
      description: "100 to 150 words",
      type: "text",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        defineField({ name: "instagram", type: "url", title: "Instagram" }),
        defineField({ name: "linkedin", type: "url", title: "LinkedIn" }),
        defineField({ name: "x", type: "url", title: "X (Twitter)" }),
      ],
    }),
    defineField({
      name: "wave",
      title: "Announcement Wave",
      description: "1, 2, 3... controls the order speakers are revealed",
      type: "number",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "isPublished",
      title: "Published",
      description: "Only published speakers appear on the live website",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "shortDescriptor", media: "photo" },
  },
});
