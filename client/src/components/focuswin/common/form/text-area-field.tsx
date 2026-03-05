// components/focuswin/common/form/text-area-field.tsx

import * as React from "react";
import UiField from "@/components/focuswin/common/ui/ui-field";
import { Textarea } from "@/components/focuswin/common/ui/textarea";

type BaseFieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
};

export type TextAreaFieldProps = BaseFieldProps & {
  value: string;
  onChange: (v: string) => void;
  textareaProps?: Omit<
    React.ComponentProps<typeof Textarea>,
    "value" | "onChange"
  >;
};

export default function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  textareaProps,
}: TextAreaFieldProps) {
  const control = (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!error}
      {...textareaProps}
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