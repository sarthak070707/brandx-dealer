import { useTranslations } from "next-intl";
import { localised } from "@/lib/i18n/content";

type Colour = { name: string; hex: string; photo: string };
type Props = { colours: Colour[]; selected: Colour; onSelect: (colour: Colour) => void };

export function ColourPicker({ colours, selected, onSelect }: Props) {
  const t = useTranslations("Colour");
  const content = useTranslations("Content");
  const nameOf = (colour: Colour) => localised(content, "colours", colour.name, colour.name);

  return (
    <fieldset>
      <legend className="mb-3 text-sm text-muted-foreground">
        {t("legend")}: <span className="text-foreground">{nameOf(selected)}</span>
      </legend>
      <div className="flex flex-wrap gap-3">
        {colours.map((colour) => (
          <label key={colour.name} className="cursor-pointer">
            <input
              type="radio"
              name="colour"
              value={colour.name}
              checked={colour.name === selected.name}
              onChange={() => onSelect(colour)}
              className="peer sr-only"
            />
            <span className="sr-only">{nameOf(colour)}</span>
            <span
              aria-hidden="true"
              style={{ backgroundColor: colour.hex }}
              className="block size-10 rounded-full border border-foreground/20 ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-ring"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
