# Business Management System - Project Documentation

## 🌍 Internationalization (i18n) Setup

This project uses **Next.js 15** with **next-intl** for internationalization, supporting **English (en)** and **Bengali (bn)** languages.

### 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (simple HTML wrapper)
│   ├── page.tsx                      # Root redirect to /en
│   ├── [locale]/
│   │   ├── layout.tsx               # Locale-specific layout with i18n providers
│   │   ├── page.tsx                 # Dashboard page
│   │   └── [other pages]/           # All app pages under locale
├── components/
│   ├── layout/
│   │   ├── header.tsx               # Header with language switcher
│   │   └── sidebar.tsx              # Navigation sidebar
│   └── ui/                          # UI components
├── i18n/
│   ├── routing.ts                   # Routing configuration
│   ├── request.ts                   # Request configuration
│   └── messages/
│       ├── en.json                  # English translations
│       └── bn.json                  # Bengali translations
└── middleware.ts                    # i18n middleware
```

### 🔧 Key Configuration Files

#### `next.config.ts`
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // i18n asset compatibility rewrites
  async rewrites() {
    return [
      {
        source: "/:locale/_next/image/:path*",
        destination: "/_next/image/:path*",
      },
      {
        source: "/:locale/fonts/:path*", 
        destination: "/fonts/:path*",
      }
    ];
  },
};

export default withNextIntl(nextConfig);
```

#### `src/i18n/routing.ts`
```typescript
import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'bn'],
  defaultLocale: 'en'
});
```

#### `src/i18n/request.ts`
```typescript
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  const locale = await requestLocale;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    messages = await import(`./messages/${locale}.json`);
  } catch (error) {
    messages = await import(`./messages/en.json`); // Fallback
  }

  return {
    messages: messages.default,
    locale
  };
});
```

#### `src/middleware.ts`
```typescript
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### 🎯 Layout Structure

#### Root Layout (`src/app/layout.tsx`)
- Simple HTML wrapper with Inter font
- No i18n logic here
- Basic metadata and global CSS

#### Locale Layout (`src/app/[locale]/layout.tsx`)
- Server Component that loads messages
- Wraps content with `NextIntlClientProvider`
- Includes Header and Sidebar components
- Validates locale and handles errors

### 🌐 Routes & URLs

- **Root**: `http://localhost:3000` → redirects to `/en`
- **English**: `http://localhost:3000/en` → Dashboard in English
- **Bengali**: `http://localhost:3000/bn` → Dashboard in Bengali

All pages are under the `[locale]` segment:
- `/en/accounts`, `/bn/accounts`
- `/en/products`, `/bn/products`
- `/en/customers`, `/bn/customers`
- etc.

### 📝 Translation Files

#### `src/i18n/messages/en.json`
```json
{
  "nav": {
    "dashboard": "Dashboard",
    "products": "Products",
    "customers": "Customers",
    // ...
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    // ...
  }
}
```

#### `src/i18n/messages/bn.json`
```json
{
  "nav": {
    "dashboard": "ড্যাশবোর্ড",
    "products": "পণ্য",
    "customers": "গ্রাহক",
    // ...
  },
  "common": {
    "save": "সংরক্ষণ",
    "cancel": "বাতিল",
    // ...
  }
}
```

### 🧩 Component Usage

#### Server Components
```typescript
import { getTranslations } from 'next-intl/server';

export default async function ServerComponent() {
  const t = await getTranslations('namespace');
  return <h1>{t('title')}</h1>;
}
```

#### Client Components
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations('namespace');
  return <h1>{t('title')}</h1>;
}
```

### 🚀 Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Test specific locale
curl -I http://localhost:3000/en
curl -I http://localhost:3000/bn
```

### 🔍 Troubleshooting

#### Common Issues:

1. **404 errors on locale pages**:
   - Check that `src/i18n/request.ts` uses `requestLocale` parameter
   - Ensure `getRequestConfig` returns `{ messages, locale }`
   - Verify message files exist in `src/i18n/messages/`

2. **"No locale was returned from getRequestConfig"**:
   - Make sure to `await requestLocale` in request config
   - Return `locale` in the config object

3. **Build errors**:
   - Check that all translation keys exist in both language files
   - Verify import paths in components

#### Debug Commands:
```bash
# Check server response
curl -s -I http://localhost:3000/en

# Check for errors in build
npm run build | grep -i error

# Test root redirect
curl -s -I http://localhost:3000
```

### 📊 Project Stats

- **Locales**: 2 (English, Bengali)
- **Pages**: 12 main pages × 2 locales = 24 total routes
- **Build**: Static Site Generation (SSG) with `generateStaticParams`
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with gradient backgrounds

### 💡 Future Enhancements

1. **Add more languages**: Update `routing.ts` and add message files
2. **Locale detection**: Add automatic locale detection by user preferences
3. **RTL support**: Add right-to-left support for Arabic/Hebrew
4. **Translation management**: Consider using a CMS for translations
5. **Performance**: Add translation lazy loading for large apps

### 🎨 UI Components

- **Header**: Language switcher, notifications, user profile
- **Sidebar**: Navigation menu with translated labels
- **Components**: Card, Button, Input, Table (reusable UI components)
- **Theme**: Purple/blue gradient background with modern design

---

## 🔧 Technical Implementation Notes

### Key Fixes Applied:
1. Used `requestLocale` parameter instead of `locale` in `getRequestConfig`
2. Added proper error handling with fallback to default locale
3. Removed explicit path from `createNextIntlPlugin()` 
4. Added i18n-compatible asset rewrites in `next.config.ts`
5. Implemented proper locale validation and message loading

### Production Ready Features:
- Static Site Generation (SSG) for all locale combinations
- Proper middleware for locale routing
- Error boundaries and fallback mechanisms
- SEO-friendly alternate language links
- Font optimization for Bengali characters

This setup provides a robust, scalable internationalization system that can be easily extended for additional languages and features.