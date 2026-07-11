import Link from "next/link";
import { InstagramIcon, LinkedinIcon, XIcon } from "@/components/ui/SocialIcons";

const QUICK_LINKS = [
  { label: "Home", href: "/" },
  { label: "Speakers", href: "/speakers" },
  { label: "Team", href: "/team" },
  { label: "Venue", href: "/venue" },
  { label: "Activations", href: "/activations" },
  { label: "Schedule", href: "/schedule" },
  { label: "Apply", href: "/apply" },
  { label: "Sponsors", href: "/sponsors" },
  { label: "Tickets", href: "/tickets" },
  { label: "FAQ", href: "/faq" },
];

export default function Footer() {
  return (
    <footer className="bg-tedx-black text-tedx-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-3">Contact</h3>
          <p className="text-sm text-gray-300">
            <a
              href="mailto:marhaba@tedxalfalahyouth.com"
              className="hover:text-tedx-red"
            >
              marhaba@tedxalfalahyouth.com
            </a>
          </p>
          <div className="flex gap-4 mt-4">
            <a href="#" aria-label="Instagram" className="hover:text-tedx-red">
              <InstagramIcon size={20} />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-tedx-red">
              <LinkedinIcon size={20} />
            </a>
            <a href="#" aria-label="X" className="hover:text-tedx-red">
              <XIcon size={20} />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3">Quick Links</h3>
          <ul className="grid grid-cols-2 gap-y-2 text-sm text-gray-300">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-tedx-red">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-3">TEDxAlFalah Youth</h3>
          <p className="text-sm text-gray-300">
            This independent TEDx event is operated under license from TED.
          </p>
          <Link
            href="/terms"
            className="text-sm underline text-gray-300 hover:text-tedx-red block mt-2"
          >
            Terms and Conditions
          </Link>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} TEDxAlFalah Youth. All rights reserved.
      </div>
    </footer>
  );
}
