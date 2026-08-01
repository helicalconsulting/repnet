import { forwardRef } from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { cn } from "../../../../lib/utils";

const DIGITS = Array.from({ length: 10 }, (_, index) => index);
const DEFAULT_TRANSITION = { stiffness: 200, damping: 20, mass: 0.4 };

function formatNumber({
  number,
  decimalPlaces,
  decimalSeparator,
  thousandSeparator,
}) {
  const value = Number.isFinite(number) ? number : 0;
  const sign = value < 0 ? "-" : "";
  const [whole, decimal] = Math.abs(value).toFixed(decimalPlaces).split(".");
  const groupedWhole = thousandSeparator
    ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
    : whole;

  return decimalPlaces > 0
    ? `${sign}${groupedWhole}${decimalSeparator}${decimal}`
    : `${sign}${groupedWhole}`;
}

function SlidingDigit({ digit, fromDigit, delay, transition, reduceMotion }) {
  const targetOffset = `${digit * -10}%`;
  const initialOffset = `${fromDigit * -10}%`;

  return (
    <span className="relative inline-flex h-[1em] w-[0.64em] overflow-hidden align-[-0.08em]">
      <Motion.span
        className="absolute inset-x-0 top-0 flex flex-col text-center leading-none will-change-transform"
        initial={reduceMotion ? false : { y: initialOffset }}
        animate={{ y: targetOffset }}
        transition={reduceMotion ? { duration: 0 } : { type: "spring", ...transition, delay }}
        aria-hidden="true"
      >
        {DIGITS.map((value) => (
          <span key={value} className="flex h-[1em] items-center justify-center">
            {value}
          </span>
        ))}
      </Motion.span>
    </span>
  );
}

export const SlidingNumber = forwardRef(function SlidingNumber(
  {
    number,
    fromNumber = 0,
    padStart = false,
    decimalSeparator = ".",
    decimalPlaces = 0,
    thousandSeparator,
    suffix,
    transition = DEFAULT_TRANSITION,
    delay = 0,
    className,
    ...props
  },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const formattedNumber = formatNumber({
    number,
    decimalPlaces,
    decimalSeparator,
    thousandSeparator,
  });
  const formattedFromNumber = formatNumber({
    number: fromNumber,
    decimalPlaces,
    decimalSeparator,
    thousandSeparator,
  });
  const characterCount = padStart
    ? Math.max(formattedNumber.length, formattedFromNumber.length)
    : formattedNumber.length;
  const targetCharacters = formattedNumber.padStart(characterCount, "0").split("");
  const fromCharacters = formattedFromNumber.padStart(characterCount, "0").split("");

  return (
    <Motion.span
      ref={ref}
      className={cn("inline-flex items-center tabular-nums leading-none", className)}
      aria-label={`${formattedNumber}${suffix || ""}`}
      {...props}
    >
      {targetCharacters.map((character, index) => {
        if (!/\d/.test(character)) {
          return (
            <span key={`${index}-${character}`} aria-hidden="true">
              {character}
            </span>
          );
        }

        const fromCharacter = fromCharacters[index];
        return (
          <SlidingDigit
            key={index}
            digit={Number(character)}
            fromDigit={/\d/.test(fromCharacter) ? Number(fromCharacter) : 0}
            delay={delay}
            transition={transition}
            reduceMotion={reduceMotion}
          />
        );
      })}
      {suffix ? (
        <span
          className="inline-flex h-[1em] items-center justify-center leading-none"
          aria-hidden="true"
        >
          {suffix}
        </span>
      ) : null}
    </Motion.span>
  );
});
