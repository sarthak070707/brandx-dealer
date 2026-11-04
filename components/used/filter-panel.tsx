import { useId } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { Slider } from "@/components/ui/slider";
import { FUEL_LABEL } from "@/lib/labels";
import { formatRupees } from "@/lib/money";
import { toggleItem } from "@/lib/utils";
import type { filterOptionsFor, UsedCarFilters } from "@/lib/used-cars/filter";

export type FilterOptions = ReturnType<typeof filterOptionsFor>;

type Props = { options: FilterOptions; filters: UsedCarFilters; onChange: (filters: UsedCarFilters) => void };

const PRICE_STEP_PAISE = 10_000_00;
const KM_STEP = 5_000;
const kmFormat = new Intl.NumberFormat("en-IN");


function CheckboxGroup<T extends string>(props: {
  legend: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm text-muted-foreground">{props.legend}</legend>
      {props.options.map((option) => (
        <label key={option.value} className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={props.selected.includes(option.value)}
            onChange={() => props.onToggle(option.value)}
            className="size-4 accent-foreground"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

export function FilterPanel({ options, filters, onChange }: Props) {
  // The panel can render twice (sidebar and phone sheet), so label ids must be unique.
  const id = useId();
  const priceRange = filters.priceRangePaise ?? options.priceBoundsPaise;
  const maxKm = filters.maxKm ?? options.maxKmBound;
  const yearOption = (year: number) => (
    <option key={year} value={year}>
      {year}
    </option>
  );

  return (
    <div className="flex flex-col gap-8">
      <CheckboxGroup
        legend="Model"
        options={options.models.map((model) => ({ value: model.slug, label: model.name }))}
        selected={filters.modelSlugs}
        onToggle={(slug) => onChange({ ...filters, modelSlugs: toggleItem(filters.modelSlugs, slug) })}
      />

      <CheckboxGroup
        legend="Fuel"
        options={options.fuels.map((fuel) => ({ value: fuel, label: FUEL_LABEL[fuel] }))}
        selected={filters.fuels}
        onToggle={(fuel) => onChange({ ...filters, fuels: toggleItem(filters.fuels, fuel) })}
      />

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="mb-3 text-sm text-muted-foreground">Year</legend>
        <label className="flex flex-col gap-1 text-sm">
          From
          <NativeSelect
            value={filters.yearFrom ?? ""}
            onChange={(event) => onChange({ ...filters, yearFrom: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Any</option>
            {options.years.map(yearOption)}
          </NativeSelect>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          To
          <NativeSelect
            value={filters.yearTo ?? ""}
            onChange={(event) => onChange({ ...filters, yearTo: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Any</option>
            {options.years.map(yearOption)}
          </NativeSelect>
        </label>
      </fieldset>

      <div className="flex flex-col gap-3">
        <p id={`${id}-price`} className="text-sm text-muted-foreground">
          Price: <span className="text-foreground">{formatRupees(priceRange[0])} to {formatRupees(priceRange[1])}</span>
        </p>
        <Slider
          aria-labelledby={`${id}-price`}
          min={options.priceBoundsPaise[0]}
          max={options.priceBoundsPaise[1]}
          step={PRICE_STEP_PAISE}
          minStepsBetweenThumbs={1}
          value={priceRange}
          onValueChange={([min, max]) => {
            const isFullRange = min === options.priceBoundsPaise[0] && max === options.priceBoundsPaise[1];
            onChange({ ...filters, priceRangePaise: isFullRange ? null : [min, max] });
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <p id={`${id}-km`} className="text-sm text-muted-foreground">
          Driven up to <span className="text-foreground">{kmFormat.format(maxKm)} km</span>
        </p>
        <Slider
          aria-labelledby={`${id}-km`}
          min={0}
          max={options.maxKmBound}
          step={KM_STEP}
          value={[maxKm]}
          onValueChange={([km]) => onChange({ ...filters, maxKm: km === options.maxKmBound ? null : km })}
        />
      </div>
    </div>
  );
}
