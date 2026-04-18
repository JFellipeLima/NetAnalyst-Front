interface Props {
  selected: string;
  onChange: (domain: string) => void;
  domains: string[];
}

export default function DomainFilter({ selected, onChange, domains }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onChange("all")}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          selected === "all"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-muted-foreground hover:text-foreground"
        }`}
      >
        All Domains
      </button>
      {domains.map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors ${
            selected === d
              ? "bg-primary text-primary-foreground"
              : "bg-accent text-muted-foreground hover:text-foreground"
          }`}
        >
          {d}
        </button>
      ))}
    </div>
  );
}