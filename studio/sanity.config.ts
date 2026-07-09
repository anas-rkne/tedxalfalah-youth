import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemaTypes";

// TODO: بعد تشغيل `npx sanity init` بمجلد studio (يتطلب حسابك على sanity.io)،
// استبدل القيمتين أدناه بمعرّف مشروعك الحقيقي، أو اترك الاعتماد على
// متغيرات البيئة SANITY_STUDIO_PROJECT_ID و SANITY_STUDIO_DATASET.
export default defineConfig({
  name: "default",
  title: "TEDxAlFalah Youth",

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "REPLACE_WITH_PROJECT_ID",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
});
