import { formatSlot } from "@/lib/dates";

type Item = { id: string; text: string; actorName: string | null; at: Date };

// A vertical history: a line down the side, a dot per event, the plain-language line beside it.
export function LeadTimeline({ items }: { items: Item[] }) {
  return (
    <ol className="ml-2 flex flex-col gap-5 border-l pl-6">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span aria-hidden="true" className="absolute top-1.5 -left-[1.9rem] size-2.5 rounded-full border-2 border-foreground bg-card" />
          <p>{item.text}</p>
          <p className="text-xs text-muted-foreground">
            <time dateTime={item.at.toISOString()}>{formatSlot(item.at)}</time>
            {item.actorName && ` · ${item.actorName}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
