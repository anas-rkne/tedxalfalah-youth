import { Link } from "@/i18n/navigation";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-8 bg-background">
      <div>
        <h1 className="text-6xl font-black text-tedx-red mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page Not Found</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-tedx-red text-white font-semibold hover:bg-tedx-red/90 transition-all"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
