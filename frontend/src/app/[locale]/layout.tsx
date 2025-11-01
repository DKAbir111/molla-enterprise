import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppShell } from "@/components/layout/AppShell";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  
  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  
  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    console.error('Error loading messages:', error);
    notFound();
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale} key={locale}>
      <AppShell>{children}</AppShell>
    </NextIntlClientProvider>
  );
}

// Avoid static pre-render issues in restricted environments
export const dynamic = 'force-dynamic'
