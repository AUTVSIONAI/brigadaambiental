import { Container } from '@/components/site/Container';

export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <div className="bg-slate-50 border-b border-slate-200">
      <Container>
        <div className="py-12">
          {eyebrow ? <div className="text-xs font-semibold tracking-widest text-emerald-800">{eyebrow}</div> : null}
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? <p className="mt-3 max-w-3xl text-base sm:text-lg text-slate-700">{description}</p> : null}
        </div>
      </Container>
    </div>
  );
}

