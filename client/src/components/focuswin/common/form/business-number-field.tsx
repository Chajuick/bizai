// src/components/focuswin/common/form/business-number-field.tsx

import * as React from "react";
import NumberField from "./number-field";

export default function BusinessNumberField({
  label = "사업자번호",
  hint,
  error,
  required,
  value,
  onChange,
  inputProps,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  inputProps?: React.ComponentProps<typeof NumberField>["inputProps"];
}) {
  return (
    <NumberField
      label={label}
      hint={hint ?? "숫자만 10자리 입력"}
      error={error}
      required={required}
      value={value}
      onChange={(v) => onChange(v.slice(0, 10))}
      inputProps={{
        placeholder: "1234567890",
        maxLength: 10,
        ...inputProps,
      }}
    />
  );
}