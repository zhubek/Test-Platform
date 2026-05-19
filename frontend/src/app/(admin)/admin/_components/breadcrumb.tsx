interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-sm text-gray-300">›</span>}
          {item.href ? (
            <a
              href={item.href}
              className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
