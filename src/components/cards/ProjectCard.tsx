import { MapPin, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  title: string;
  summary: string;
  location: string;
  budget: string;
  budgetType: "exact" | "range" | "open";
  category: string;
  postedAt: string;
  imageUrl?: string;
}

const ProjectCard = ({
  id,
  title,
  summary,
  location,
  budget,
  budgetType,
  category,
  postedAt,
  imageUrl,
}: ProjectCardProps) => {
  const getBudgetBadge = () => {
    switch (budgetType) {
      case "exact":
        return { bg: "bg-emerald-500/10 text-emerald-600", label: budget };
      case "range":
        return { bg: "bg-blue-500/10 text-blue-600", label: budget };
      case "open":
        return { bg: "bg-amber-500/10 text-amber-600", label: "A combinar" };
      default:
        return { bg: "bg-muted text-muted-foreground", label: budget };
    }
  };

  const budgetBadge = getBudgetBadge();

  return (
    <Link
      to={`/projeto/${id}`}
      className="group block bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Image */}
      {imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${budgetBadge.bg}`}>
              {budgetBadge.label}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <span className="inline-block px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary mb-3">
          {category}
        </span>

        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {summary}
        </p>

        {!imageUrl && (
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-4 w-4 text-secondary" />
            <span className={`px-2 py-1 rounded text-xs font-semibold ${budgetBadge.bg}`}>
              {budgetBadge.label}
            </span>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{postedAt}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
