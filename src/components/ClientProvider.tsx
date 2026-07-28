"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";

export function ClientProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    import(`../../messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch(() => setMessages(null));
  }, [locale]);

  if (!messages) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
