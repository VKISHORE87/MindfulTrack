interface PageHeaderProps {
  heading: string;
  subheading?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ heading, subheading, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{heading}</h1>
        {subheading && (
          <p className="text-gray-500 mt-1 max-w-4xl">{subheading}</p>
        )}
      </div>
      {actions && <div className="flex-shrink-0">{actions}</div>}
    </div>
  );
}
