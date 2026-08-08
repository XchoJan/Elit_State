/**
 * Вставляет разметку Schema.org в страницу. Серверный компонент —
 * на клиент не уезжает ни байта JavaScript, только готовый <script> в HTML.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
