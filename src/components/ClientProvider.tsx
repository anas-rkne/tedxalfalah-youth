"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { useEffect, useState } from "react";

export function ClientProvider({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);

  useEffect(() => {
    import(`../../messages/${locale}.json`)
      .then((mod) => setMessages(mod.default as AbstractIntlMessages))
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
