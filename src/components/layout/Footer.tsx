import { Building2, Facebook, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ConstruLink</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Conectando clientes e profissionais da construção civil, arquitetura e marcenaria.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-background/10 hover:bg-background/20 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Links Rápidos</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><Link to="/profissionais" className="hover:text-background transition-colors">Encontrar Profissionais</Link></li>
              <li><Link to="/projetos" className="hover:text-background transition-colors">Ver Projetos</Link></li>
              <li><Link to="/como-funciona" className="hover:text-background transition-colors">Como Funciona</Link></li>
              <li><Link to="/cadastro" className="hover:text-background transition-colors">Cadastrar-se</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Serviços</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li><a href="#" className="hover:text-background transition-colors">Construção Civil</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Arquitetura</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Marcenaria</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Reformas</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contato</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                contato@construlink.com.br
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                (11) 99999-9999
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                São Paulo, SP
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60">
          <p>&copy; {new Date().getFullYear()} ConstruLink. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-background transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-background transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
