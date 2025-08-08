import { ReactNode } from "react";

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-lg border bg-card/60 p-6 text-center shadow-sm">
    <div className="text-3xl font-semibold text-brand">{value}</div>
    <div className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
  </div>
);

const Stats = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard value="5,382" label="Analyses Completed" />
        <StatCard value="27,233" label="Filings Analyzed" />
        <StatCard value="8,841" label="News Stories Read" />
        <StatCard value="38,197" label="Discussions Analyzed" />
      </div>
    </section>
  );
};

export default Stats;
