import { Menu, User, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getDisplayName } from "@/lib/user";

type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string;
  personType?: string | null;
  tradeName?: string | null;
  companyName?: string | null;
};

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Inicio", path: "/" },
    { label: "Profissionais", path: "/profissionais" },
    { label: "Projetos", path: "/projetos" },
    { label: "Como Funciona", path: "/como-funciona" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const displayName = useMemo(() => getDisplayName(authUser, "Usuario"), [authUser]);

  useEffect(() => {
    const loadUser = () => {
      const raw = localStorage.getItem("auth_user");
      if (!raw) {
        setAuthUser(null);
        return;
      }
      try {
        setAuthUser(JSON.parse(raw) as AuthUser);
      } catch {
        setAuthUser(null);
      }
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("auth:changed", loadUser as EventListener);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("auth:changed", loadUser as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_user");
    window.dispatchEvent(new Event("auth:changed"));
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center">
          <img
            src="/SO_Logo_horizontal.png"
            alt="Segunda Opiniao"
            className="h-24 w-auto"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {authUser ? (
            <>
              <Link
                to="/dashboard-usuario"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{displayName}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button variant="default" size="sm">
                  Cadastrar-se
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
              {authUser ? (
                <>
                  <Link
                    to="/dashboard-usuario"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-medium">{displayName}</span>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="default" className="w-full">
                      Cadastrar-se
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
