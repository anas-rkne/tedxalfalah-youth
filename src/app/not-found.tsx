import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-background gap-6">
      <h1 className="text-7xl font-black text-tedx-red">404</h1>
      <p className="text-xl text-muted-foreground">Page Not Found</p>
      <p className="text-sm text-muted-foreground/70">الصفحة غير موجودة</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/en"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tedx-red text-white font-semibold hover:bg-tedx-red/90 transition-all"
        >
          English
        </Link>
        <Link
          href="/ar"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white font-semibold hover:bg-black/90 transition-all"
        >
          العربية
        </Link>
      </div>
    </div>
  );
}