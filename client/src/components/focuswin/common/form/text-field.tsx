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

export type TextFieldProps = BaseFieldProps & {
  value: string;
  onChange: (v: string) => void;
  inputProps?: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type">;
};

export default function TextField({ label, hint, error, required, className, value, onChange, inputProps }: TextFieldProps) {
  return (
    <div className={className}>
      {label ? (
        <UiField label={typeof label === "string" && required ? `${label} *` : (label as any)} hint={error ?? hint}>
          <Input value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} {...inputProps} />
        </UiField>
      ) : (
        <Input value={value} onChange={e => onChange(e.target.value)} aria-invalid={!!error} {...inputProps} />
      )}
    </div>
  );
}
