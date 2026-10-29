import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

type Props = {
  id: string;
  title: string;
  subtitle?: string | null;
  action?: { label: string; href: string };
  children?: React.ReactNode; // controles extra a la derecha (p. ej. flechas del carrusel)
};

export function SectionHeader({ id, title, subtitle, action, children }: Props) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 lg:mb-8">
      <div>
        <h2 id={id} className="text-2xl leading-tight font-bold lg:text-[2rem]">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action && (
          <Link
            href={action.href}
            className="group/action inline-flex min-h-tap items-center gap-1.5 font-semibold text-brand hover:underline hover:underline-offset-4"
          >
            {action.label}
            <ArrowRightIcon className="size-4 transition-transform group-hover/action:translate-x-0.5" aria-hidden="true" />
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
