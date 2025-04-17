import React, { useRef, useState, useEffect, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
  prefix?: string;
  thousandSeparator?: string;
  decimalSeparator?: string;
  allowNegative?: boolean;
  max?: number;
  min?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      className,
      prefix = "",
      thousandSeparator = ".",
      decimalSeparator = ",",
      allowNegative = false,
      max,
      min,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = (node: HTMLInputElement) => {
      // @ts-ignore - handle ref merging
      if (ref) ref.current = node;
      inputRef.current = node;
    };

    // Format a number for display with thousand separators
    const formatNumber = (num: number | string): string => {
      if (num === null || num === undefined || num === "") return "";
      
      let numStr = String(num).replace(/[^0-9-]/g, "");
      
      // Handle negative numbers
      const isNegative = numStr.startsWith("-");
      if (isNegative && !allowNegative) {
        numStr = numStr.substring(1);
      }
      
      // Apply thousand separator
      const parts = [];
      for (let i = numStr.length; i > 0; i -= 3) {
        parts.unshift(numStr.substring(Math.max(0, i - 3), i));
      }
      
      return `${prefix}${isNegative && allowNegative ? "-" : ""}${parts.join(thousandSeparator)}`;
    };

    // Parse the displayed value back to a number
    const parseNumber = (str: string): number => {
      if (!str) return 0;
      // Handle prefix (like 'Rp ') by removing it
      let cleanStr = prefix ? str.replace(prefix, "") : str;
      // Remove thousand separators
      cleanStr = cleanStr.replace(new RegExp(thousandSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), "");
      // Keep only digits and minus sign
      cleanStr = cleanStr.replace(/[^0-9-]/g, "");
      
      return Number(cleanStr) || 0;
    };

    // Initialize display value
    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatNumber(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty input
      if (!inputValue) {
        setDisplayValue("");
        onChange(0);
        return;
      }
      
      // Format the input
      const rawValue = parseNumber(inputValue);
      
      // Check min/max constraints
      if (max !== undefined && rawValue > max) {
        setDisplayValue(formatNumber(max));
        onChange(max);
        return;
      }
      
      if (min !== undefined && rawValue < min) {
        setDisplayValue(formatNumber(min));
        onChange(min);
        return;
      }
      
      setDisplayValue(formatNumber(rawValue));
      onChange(rawValue);
    };

    return (
      <Input
        {...props}
        ref={mergedRef}
        className={cn("font-mono", className)}
        value={displayValue}
        onChange={handleChange}
        onBlur={() => {
          // Re-format on blur to ensure consistent display
          setDisplayValue(formatNumber(parseNumber(displayValue)));
        }}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
