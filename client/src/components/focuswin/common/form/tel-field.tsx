// components/focuswin/common/form/tel-field.tsx
//
// TelField (KR 기본) — 업무툴용 “안전한 자동 포맷”
// - 입력 중: 숫자만 추출 후 02 / 010-011-016-017-018-019 / 지역번호(3자리) 기준으로 하이픈 포맷
// - 허용 문자: 숫자만 (붙여넣기 포함). +82 같은 국제 포맷은 옵션으로 확장 가능
// - 커서 튐 최소화: "raw → formatted" 변화량 기반으로 caret 위치 보정
//
// NOTE
// - 완벽한 caret 보정은 모든 케이스를 100% 커버하기 어렵지만,
//   실사용에서 가장 흔한 케이스(타이핑/백스페이스/붙여넣기) 중심으로 안정화했습니다.

import * as React from "react";
import UiField from "@/components/focuswin/common/ui/ui-field";
import { Input } from "@/components/focuswin/common/ui/input";

// #region Types
type BaseFieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
};

export type TelFieldProps = BaseFieldProps & {
  value: string;
  onChange: (v: string) => void;

  /**
   * 저장 포맷
   * - "formatted": 010-1234-5678 (기본)
   * - "digits": 01012345678
   */
  storeAs?: "formatted" | "digits";

  /**
   * 붙여넣기/입력 시 허용할 최대 숫자 길이(기본 11)
   * - 02 포함 유선도 10자리로 커버
   */
  maxDigits?: number;

  inputProps?: Omit<
    React.ComponentProps<typeof Input>,
    "value" | "onChange" | "type" | "inputMode" | "maxLength"
  >;
};
// #endregion

// #region Helpers
function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function clampDigits(d: string, maxDigits: number) {
  return d.slice(0, Math.max(0, maxDigits));
}

function isSeoul(d: string) {
  return d.startsWith("02");
}

function formatKRPhoneFromDigits(digits: string) {
  // 02 (서울)
  if (isSeoul(digits)) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  // 나머지: 3자리 지역번호/휴대폰(010 등)
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/**
 * caret 보정
 * - 입력 전/후 문자열에서 caret 이전에 존재하는 "숫자 개수"를 기준으로
 *   포맷 후 문자열에서 동일한 숫자 개수 위치로 caret을 이동
 */
function computeNextCaretByDigitCount(params: {
  rawBefore: string;
  caretBefore: number;
  formattedAfter: string;
}) {
  const { rawBefore, caretBefore, formattedAfter } = params;

  // caret 이전에 있었던 숫자 개수
  const digitsBeforeCaret = digitsOnly(rawBefore.slice(0, caretBefore)).length;

  if (digitsBeforeCaret <= 0) return 0;

  // formattedAfter에서 digitsBeforeCaret 번째 숫자 "뒤" 위치를 찾음
  let seen = 0;
  for (let i = 0; i < formattedAfter.length; i++) {
    if (/\d/.test(formattedAfter[i])) {
      seen++;
      if (seen === digitsBeforeCaret) return i + 1;
    }
  }
  return formattedAfter.length;
}
// #endregion

// #region Component
export default function TelField({
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  storeAs = "formatted",
  maxDigits = 11,
  inputProps,
}: TelFieldProps) {
  // Input DOM ref (caret 보정용)
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const applyChange = React.useCallback(
    (rawValue: string, caretBefore: number | null) => {
      // 1) 숫자만 추출 + 길이 제한
      const digits = clampDigits(digitsOnly(rawValue), maxDigits);

      // 2) 표시용 포맷
      const formatted = formatKRPhoneFromDigits(digits);

      // 3) 외부 저장값 결정
      const nextValue = storeAs === "digits" ? digits : formatted;

      // 4) 상태 반영
      onChange(nextValue);

      // 5) caret 보정(가능하면)
      if (caretBefore == null) return;
      const el = inputRef.current;
      if (!el) return;

      // storeAs가 digits면 화면에도 digits만 보여줄 수 있는데
      // 현재 컴포넌트는 value 그대로 보여주므로,
      // storeAs="digits"로 쓰려면 상위에서 displayValue를 따로 관리하거나
      // 아래처럼 강제로 formatted를 value로 저장하는 방식을 추천.
      // (그래도 caret 계산 자체는 formatted 기준이 더 자연스러움)
      const nextCaret = computeNextCaretByDigitCount({
        rawBefore: rawValue,
        caretBefore,
        formattedAfter: storeAs === "digits" ? digits : formatted,
      });

      // React 렌더 이후 적용
      requestAnimationFrame(() => {
        try {
          el.setSelectionRange(nextCaret, nextCaret);
        } catch {
          // 일부 input 타입/환경에서 setSelectionRange 실패할 수 있음
        }
      });
    },
    [maxDigits, onChange, storeAs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const caretBefore = e.target.selectionStart;
    applyChange(raw, caretBefore);
  };

  const control = (
    <Input
      ref={inputRef}
      type="tel"
      inputMode="tel"
      // 모바일에서 - 입력이 가능해야 하므로 pattern은 너무 강하게 걸지 않음(선택)
      autoComplete="tel"
      value={value}
      onChange={handleChange}
      aria-invalid={!!error}
      // maxLength: 하이픈까지 포함하면 13(010-1234-5678) / 12(02-1234-5678)
      // 너무 빡빡하면 지역번호/중간 길이 케이스가 불편해서 여유있게
      maxLength={18}
      {...inputProps}
    />
  );

  return (
    <div className={className}>
      {label ? (
        <UiField
          label={typeof label === "string" && required ? `${label} *` : (label as any)}
          hint={error ?? hint}
        >
          {control}
        </UiField>
      ) : (
        control
      )}
    </div>
  );
}
// #endregion