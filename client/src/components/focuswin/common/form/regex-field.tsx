// components/focuswin/common/form/regex-field.tsx

import * as React from "react";
import { Input } from "@/components/focuswin/common/ui/input";
import { Field } from "./field";

type ValidateMode = "change" | "blur" | "submit";

type Props = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  required?: boolean;

  value: string;
  onChange: (v: string) => void;

  pattern: RegExp;
  errorMessage?: string;

  /** UX: change(즉시) / blur(포커스 아웃 후) / submit(외부 트리거) */
  validateMode?: ValidateMode;

  /** submit 모드일 때만 필요: 제출 시 true로 줘서 에러 표시 */
  submitted?: boolean;

  /** 입력값 정규화 (메일/아이디는 trim 추천, 비번은 보통 undefined) */
  normalize?: (v: string) => string;

  inputProps?: Omit<React.ComponentProps<typeof Input>, "value" | "onChange">;
};

function safeTest(pattern: RegExp, v: string) {
  // g/y 플래그로 test가 흔들리는 케이스 방지
  if (pattern.global || (pattern as any).sticky) pattern.lastIndex = 0;
  return pattern.test(v);
}

export default function RegexField({
  label,
  hint,
  required,
  value,
  onChange,
  pattern,
  errorMessage = "형식이 올바르지 않습니다.",
  validateMode = "blur",
  submitted = false,
  normalize,
  inputProps,
}: Props) {
  const [touched, setTouched] = React.useState(false);

  const normalized = normalize ? normalize(value) : value;

  const isValid =
    normalized.length === 0 ? !required : safeTest(pattern, normalized);

  const showError =
    !isValid &&
    ((validateMode === "change" && normalized.length > 0) ||
      (validateMode === "blur" && touched) ||
      (validateMode === "submit" && submitted));

  const error = showError ? errorMessage : undefined;

  return (
    <Field label={label} hint={hint} error={error} required={required}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={!!error}
        {...inputProps}
      />
    </Field>
  );
}