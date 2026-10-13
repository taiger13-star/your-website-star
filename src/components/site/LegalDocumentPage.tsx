import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import legalDocuments from "@/content/legal-documents.json";

type LegalDocumentKey = keyof typeof legalDocuments;
type SourceBlock = { type: string; text: string };
type TextBlock = { type: "title" | "heading" | "paragraph"; text: string };
type ListBlock = { type: "list"; items: string[] };
type DisplayBlock = TextBlock | ListBlock;

const documentLabels: Record<LegalDocumentKey, string> = {
  privacy: "Политика обработки персональных данных",
  data: "Согласие на обработку персональных данных",
  terms: "Пользовательское соглашение",
};

function groupBlocks(blocks: SourceBlock[]): DisplayBlock[] {
  const grouped: DisplayBlock[] = [];

  for (const block of blocks) {
    if (block.type === "bullet") {
      const last = grouped[grouped.length - 1];
      if (last?.type === "list") {
        last.items.push(block.text);
      } else {
        grouped.push({ type: "list", items: [block.text] });
      }
    } else if (block.type === "title" || block.type === "heading") {
      grouped.push({ type: block.type, text: block.text });
    } else {
      grouped.push({ type: "paragraph", text: block.text });
    }
  }

  return grouped;
}

export function LegalDocumentPage({ documentKey }: { documentKey: LegalDocumentKey }) {
  const blocks = groupBlocks(legalDocuments[documentKey]);
  const title = legalDocuments[documentKey][0]?.text ?? documentLabels[documentKey];
  const sections = blocks.filter(
    (block): block is TextBlock & { type: "heading" } => block.type === "heading",
  );

  return (
    <div className="container-page pb-20 pt-10 md:pb-28 md:pt-14">
      <Breadcrumbs
        items={[{ label: "Главная", to: "/" }, { label: documentLabels[documentKey] }]}
      />

      <div className="mt-8 border-b border-hairline pb-10 md:mt-12 md:pb-14">
        <p className="label-caps text-taupe">Правовая информация · NOIR ATELIER</p>
        <h1 className="mt-5 max-w-5xl font-display text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
          {title}
        </h1>
      </div>

      <div className="grid gap-12 pt-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-label="Разделы документа" className="lg:sticky lg:top-28 lg:self-start">
          <p className="label-caps text-taupe">Содержание</p>
          <ol className="mt-5 space-y-3 border-l border-hairline pl-5">
            {sections.map((section, index) => (
              <li key={section.text}>
                <a
                  href={`#section-${index + 1}`}
                  className="text-sm leading-relaxed text-ink-soft transition-colors hover:text-foreground"
                >
                  {section.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="min-w-0 max-w-3xl space-y-5 text-[0.9375rem] leading-7 text-ink-soft md:text-base md:leading-8">
          {blocks.map((block, index) => {
            if (block.type === "title") return null;
            if (block.type === "heading") {
              const sectionNumber = sections.findIndex((section) => section === block) + 1;
              return (
                <h2
                  key={index}
                  id={`section-${sectionNumber}`}
                  className="scroll-mt-28 border-t border-hairline pt-8 font-display text-3xl leading-tight text-foreground first:border-0 first:pt-0 md:text-4xl"
                >
                  {block.text}
                </h2>
              );
            }
            if (block.type === "list") {
              return (
                <ul key={index} className="list-disc space-y-2 pl-6 marker:text-taupe">
                  {block.items.map((item) => (
                    <li key={item} className="pl-1">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
            return <p key={index}>{block.text}</p>;
          })}
        </article>
      </div>
    </div>
  );
}
