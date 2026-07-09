import { defineField, defineType } from "sanity";

export default defineType({
  name: "sponsor",
  title: "Sponsor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tier",
      title: "Tier",
      type: "string",
      options: {
        list: ["Platinum", "Gold", "Silver", "Community"],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "websiteUrl",
      title: "Website URL",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "tier", media: "logo" },
  },
});
