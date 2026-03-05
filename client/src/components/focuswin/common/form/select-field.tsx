import * as React from "react";
import UiField from "@/components/focuswin/common/ui/ui-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/focuswin/common/ui/select";

type BaseFieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
};

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SelectFieldProps = BaseFieldProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: React.ReactNode;
  options: SelectOption[];
  size?: "sm" | "default";
  triggerClassName?: string;
  contentClassName?: string;
};

export default function SelectField({
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  placeholder = "선택…",
  options,
  size = "default",
  triggerClassName,
  contentClassName,
}: SelectFieldProps) {
  return (
    <div className={className}>
      <UiField label={typeof label === "string" && required ? `${label} *` : (label as any)} hint={error ?? hint}>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger size={size} className={triggerClassName} aria-invalid={!!error}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>

          <SelectContent className={contentClassName}>
            {options.map(opt => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </UiField>
    </div>
  );
}
