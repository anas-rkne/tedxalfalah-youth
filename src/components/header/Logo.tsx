import { Link } from "@/i18n/navigation";
import SafeImage from "@/components/ui/SafeImage";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative h-12 w-36 sm:h-14 sm:w-40 md:h-16 md:w-48 lg:h-[72px] lg:w-56">
        <SafeImage
          src="/images/logo-black.png"
          alt="TEDxAlFalah Youth"
          fill
          sizes="(max-width: 640px) 144px, (max-width: 768px) 160px, (max-width: 1024px) 192px, 224px"
          className="object-contain"
          priority
          quality={90}
        />
      </div>
    </Link>
  );
}