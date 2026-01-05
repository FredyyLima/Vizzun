import { Star, MapPin, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ProfessionalCardProps {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  location: string;
  verified: boolean;
  services: string[];
}

const ProfessionalCard = ({
  id,
  name,
  avatar,
  specialty,
  rating,
  reviewCount,
  location,
  verified,
  services,
}: ProfessionalCardProps) => {
  return (
    <Link
      to={`/profissional/${id}`}
      className="group block bg-card rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Header with Avatar */}
      <div className="relative p-6 pb-4">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-border group-hover:ring-primary/30 transition-all"
            />
            {verified && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">{specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="text-sm font-medium text-foreground">{rating.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground text-sm">({reviewCount} avaliações)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Tags */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {services.slice(0, 3).map((service, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary"
            >
              {service}
            </span>
          ))}
          {services.length > 3 && (
            <span className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
              +{services.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-muted/50 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <span className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
          Ver perfil →
        </span>
      </div>
    </Link>
  );
};

export default ProfessionalCard;
