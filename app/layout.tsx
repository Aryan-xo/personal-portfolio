import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { config } from "@/lib/config";
import { themes, defaultTheme } from "@/lib/themes";
import "./globals.css";

// Vercel sets this on deploys; localhost is the fallback for `next dev`.
const site = process.env.NEXT_PUBLIC_SITE_URL
  ? `https://${process.env.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, "")}`
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

const title = `${config.identity.name} — ${config.identity.headline}`;
const description =
  "Terminal portfolio for Aryan Kumar — software engineer at Loop Health, " +
  "IIT Bombay '26. Distributed systems, event pipelines and ML.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title,
  description,
  alternates: { canonical: "/" },
  keywords: [
    "Aryan Kumar", "software engineer", "IIT Bombay", "Loop Health",
    "distributed systems", "machine learning", "backend", "portfolio",
  ],
  authors: [{ name: config.identity.name, url: config.contact.linkedin }],
  openGraph: { title, description, type: "profile", siteName: config.identity.name },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: defaultTheme.bg,
  colorScheme: "light dark",
};

/**
 * Applies the stored theme before the first paint. Without it a reader who
 * chose a dark theme gets a frame of paper-white on every navigation, which is
 * worse than any flash the script itself costs.
 */
const themeBootstrap = `
(function(){try{
  var t=${JSON.stringify(
    Object.fromEntries(themes.map((t) => [t.name, [t.bg, t.fg, t.accent, t.dim, t.glow, t.light ? 1 : 0]]))
  )};
  var n=localStorage.getItem("theme");
  var v=t[n];
  if(v){var r=document.documentElement;
    r.style.setProperty("--bg",v[0]);r.style.setProperty("--fg",v[1]);
    r.style.setProperty("--accent",v[2]);r.style.setProperty("--dim",v[3]);
    r.style.setProperty("--glow",v[4]);
    r.classList.toggle("light",!!v[5]);r.classList.toggle("crt-dark",!v[5]);}
  if(localStorage.getItem("crt")==="off")document.documentElement.classList.add("plain");
}catch(e){}})();
`;

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: config.identity.name,
  jobTitle: config.identity.title,
  email: `mailto:${config.contact.email}`,
  telephone: config.contact.phone,
  url: site,
  image: `${site}/opengraph-image`,
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  alumniOf: config.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.school })),
  worksFor: { "@type": "Organization", name: config.experience[0].company },
  sameAs: [
    config.contact.github,
    config.contact.githubWork,
    config.contact.linkedin,
    config.contact.leetcode,
  ],
  knowsAbout: Object.values(config.skills).flat().slice(0, 30),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>
        {children}
        <Analytics />
        {/* Structured data, so search engines read this as a person rather
            than as a wall of monospace. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
