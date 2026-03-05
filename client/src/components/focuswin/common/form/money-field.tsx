// components/focuswin/common/form/money-field.tsx
import * as React from "react";
import { Input } from "@/components/focuswin/common/ui/input";
import { Field } from "./field";

// 숫자만 남기기
const digitsOnly = (v: string) => v.replace(/[^\d]/g, "");

// Number 변환 없이 천단위 콤마
const formatComma = (rawDigits: string) => {
  const d = digitsOnly(rawDigits);
  if (!d) return "";
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function MoneyField({
  label,
  hint,
  error,
  required,
  value, // raw digits string 권장
  onChange,
  onValueChange,
  inputProps,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;

  value: string;
  onChange: (rawDigits: string) => void;
  onValueChange?: (n: number | null) => void;

  inputProps?: Omit<
    React.ComponentProps<typeof Input>,
    "value" | "onChange" | "inputMode"
  >;
}) {
  const [focused, setFocused] = React.useState(false);

  // 표시값: blur일 때만 콤마 (현재 UX 유지)
  const shown = focused ? value : formatComma(value);

  // right: 중복 방지 위해 focus일 때만 “원” 표시(선택)
  const right = value && focused ? `${formatComma(value)}원` : undefined;

  return (
    <Field label={label} hint={hint} error={error} required={required} right={right}>
      <Input
        inputMode="numeric"
        value={shown}
        aria-invalid={!!error}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = digitsOnly(e.target.value);
          onChange(raw);

          // number 변환은 옵션: 길면 null 또는 clamp 정책을 정해야 함
          if (onValueChange) {
            // 너무 큰 값은 Number로 안전하지 않으니 길이 제한(선택)
            // 15자리 이상이면 Number 정밀도 위험 → null 처리
            if (!raw) onValueChange(null);
            else if (raw.length >= 16) onValueChange(null);
            else onValueChange(Number(raw));
          }
        }}
        {...inputProps}
      />
    </Field>
  );
}