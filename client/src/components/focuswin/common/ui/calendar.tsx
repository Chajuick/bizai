import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/focuswin/common/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        // ✅ keep calendar area clean; popover provides the card surface
        "bg-transparent group/calendar p-1.5 [--cell-size:--spacing(8)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: date =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-3", defaultClassNames.month),

        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          // ✅ icon buttons should be subtle
          "size-(--cell-size) p-0 select-none rounded-xl",
          "aria-disabled:opacity-40",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) p-0 select-none rounded-xl",
          "aria-disabled:opacity-40",
          defaultClassNames.button_next
        ),

        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-semibold justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),

        // ✅ month dropdown (subtle)
        dropdown_root: cn(
          "relative rounded-xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]",
          "has-focus:shadow-[0_0_0_1px_rgba(37,99,235,0.18),0_1px_2px_rgba(15,23,42,0.06)]",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),

        caption_label: cn(
          "select-none font-semibold",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-xl pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),

        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-medium text-[0.78rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),

        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          defaultClassNames.day
        ),

        // ✅ range styling (soft sky)
        range_start: cn("rounded-l-xl", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-xl", defaultClassNames.range_end),

        // ✅ today: thin outline + very light sky
        today: cn(
          "rounded-xl bg-primary/10 text-foreground",
          "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
          defaultClassNames.today
        ),

        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground/70",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-40", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          if (orientation === "right")
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-(--cell-size) items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        [
          "flex aspect-square w-full min-w-(--cell-size) items-center justify-center",
          "rounded-xl font-medium",
          "transition-[background-color,color,box-shadow] duration-150 ease-out",
          // ✅ hover (soft sky)
          "hover:bg-primary/10",
          // ✅ single selected
          "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
          // ✅ range
          "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
          "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
          "data-[range-middle=true]:bg-primary/10 data-[range-middle=true]:text-foreground",
          // ✅ focus (no thick ring)
          "outline-none focus-visible:shadow-[0_0_0_1px_rgba(37,99,235,0.18)]",
          // rounding for range edges
          "data-[range-start=true]:rounded-l-xl data-[range-end=true]:rounded-r-xl data-[range-middle=true]:rounded-none",
        ].join(" "),
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };