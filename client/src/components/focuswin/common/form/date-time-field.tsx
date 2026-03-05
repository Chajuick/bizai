import * as React from "react";
import UiField from "@/components/focuswin/common/ui/ui-field";
import { Input } from "@/components/focuswin/common/ui/input";

type BaseFieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
};

export type DateTimeFieldProps = BaseFieldProps & {
  /** datetime-local: YYYY-MM-DDTHH:mm */
  value: string;
  onChange: (v: string) => void;
  inputProps?: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">;
};

export default function DateTimeField({ label, hint, error, required, className, value, onChange, inputProps }: DateTimeFieldProps) {
  return (
    <div className={className}>
      <UiField label={typeof label === "string" && required ? `${label} *` : (label as any)} hint={error ?? hint}>
        <Input type="datetime-local" value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} {...inputProps} />
      </UiField>
    </div>
  );
}
