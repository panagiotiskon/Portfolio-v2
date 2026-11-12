import EnGarde from "@/components/en-garde/EnGarde";
import { SITE, SITE_URL } from "@/lib/site";

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: SITE_URL,
  image: `${SITE_URL}/portrait.png`,
  jobTitle: SITE.jobTitle,
  description: SITE.description,
  alumniOf: { "@type": "CollegeOrUniversity", name: "National and Kapodistrian University of Athens" },
  sameAs: SITE.sameAs,
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so content can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd).replace(/</g, "\\u003c") }}
      />
      <EnGarde />
    </>
  );
}
