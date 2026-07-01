import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AlertTriangle } from "lucide-react";

const TermosDeUso = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground mb-8">Última atualização: a definir</p>

          <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 mb-8">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Aviso:</strong> este documento é um modelo genérico, criado para preencher a exigência
              legal mínima de ter Termos de Uso publicados durante o desenvolvimento da plataforma. Ele{" "}
              <strong>não foi revisado por um advogado</strong> e não deve ser considerado válido juridicamente
              até que passe por essa revisão antes do lançamento em produção.
            </p>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Aceitação dos termos</h2>
              <p>
                Ao criar uma conta ou utilizar a plataforma Vizzun ("Plataforma"), você concorda com estes Termos
                de Uso e com a nossa{" "}
                <a href="/politica-de-privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </a>
                . Se você não concordar com algum ponto, não utilize a Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. O que é a Plataforma</h2>
              <p>
                A Vizzun é um marketplace que conecta clientes que precisam de serviços de construção civil,
                arquitetura, marcenaria e áreas relacionadas a profissionais e empresas que prestam esses
                serviços. A Vizzun atua como intermediadora do contato e da negociação entre as partes, mas{" "}
                <strong>não é parte no contrato de prestação de serviço</strong> firmado entre cliente e
                profissional.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Cadastro e veracidade das informações</h2>
              <p>
                Você é responsável por fornecer informações verdadeiras, completas e atualizadas no cadastro
                (incluindo CPF, RG, CNPJ e dados de contato) e por manter a confidencialidade da sua senha. A
                Vizzun pode suspender ou encerrar contas com dados falsos ou inconsistentes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Negociação e fechamento de negócios</h2>
              <p>
                O chat e o fluxo de "fechar negócio" da Plataforma servem para registrar o interesse e o acordo
                entre as partes, mas não substituem um contrato formal de prestação de serviço quando a
                complexidade ou o valor do projeto justificar um. Recomenda-se que cliente e profissional
                formalizem, entre si, os termos específicos de cada serviço (prazo, valor, garantias).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Responsabilidades</h2>
              <p>
                A Vizzun não garante a qualidade, a legalidade ou a execução dos serviços prestados por
                profissionais cadastrados, nem a capacidade de pagamento ou idoneidade dos clientes. A relação de
                prestação de serviço é de responsabilidade exclusiva das partes envolvidas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Conduta na Plataforma</h2>
              <p>
                É proibido usar a Plataforma para fins ilícitos, enviar conteúdo ofensivo, discriminatório ou
                fraudulento, ou tentar contornar as funcionalidades de segurança do sistema.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Alterações destes termos</h2>
              <p>
                Podemos atualizar estes Termos de Uso periodicamente. Alterações relevantes serão comunicadas
                pela Plataforma antes de entrarem em vigor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Contato</h2>
              <p>Dúvidas sobre estes termos podem ser enviadas para o canal de contato indicado no rodapé do site.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermosDeUso;
