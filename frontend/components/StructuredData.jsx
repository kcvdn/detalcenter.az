function serializeStructuredData(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function StructuredData({ data }) {
  if (!data) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeStructuredData(data),
      }}
    />
  );
}
