// components/focuswin/common/form/number-field.tsx
import * as React from "react";
import { Input } from "@/components/focuswin/common/ui/input";
import { Field } from "./field";

function onlyNumberLike(v: string) {
  // 음수/소수까지 허용하려면 여기 확장
  return v.replace(/[^\d]/g, "");
}

export default function NumberField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  onValueChange,
  inputProps,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  onValueChange?: (n: number | null) => void;
  inputProps?: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "inputMode">;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <Input
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const next = onlyNumberLike(e.target.value);
          onChange(next);
          onValueChange?.(next ? Number(next) : null);
        }}
        aria-invalid={!!error}
        {...inputProps}
      />
    </Field>
  );
}