export default function JsonLd({ data }: { data: object | object[] }) {
  // "<" is escaped so product text can never close the script tag early.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
