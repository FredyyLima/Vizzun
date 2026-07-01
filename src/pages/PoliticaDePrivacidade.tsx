import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AlertTriangle } from "lucide-react";
import SeoHead from "@/components/SeoHead";

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title="Política de Privacidade" description="Confira a política de privacidade da plataforma Vizzun." />
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground mb-8">Última atualização: a definir</p>

          <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 mb-8">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Aviso:</strong> este documento é um modelo genérico, criado para preencher a exigência
              legal mínima de ter uma Política de Privacidade publicada durante o desenvolvimento da plataforma.
              Ele <strong>não foi revisado por um advogado</strong> especializado em LGPD e não deve ser
              considerado válido juridicamente até que passe por essa revisão antes do lançamento em produção.
            </p>
          </div>

          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Quem trata os seus dados</h2>
              <p>
                A Vizzun ("nós") é a controladora dos dados pessoais tratados na plataforma, nos termos da Lei
                Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. Quais dados coletamos</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Dados de identificação: nome, CPF, RG, data de nascimento, CNPJ e razão social (para contas de profissional pessoa jurídica).</li>
                <li>Dados de contato: e-mail e telefone.</li>
                <li>Documentos enviados: cartão CNPJ, quando aplicável.</li>
                <li>Conteúdo gerado por você: anúncios de projeto, mensagens de chat, anexos (imagens, áudios, arquivos) e avaliações.</li>
                <li>Dados de acesso: registros técnicos necessários para autenticação e segurança da conta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Para que usamos esses dados</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Criar e autenticar sua conta.</li>
                <li>Conectar clientes e profissionais e viabilizar a negociação entre as partes.</li>
                <li>Exibir seu perfil profissional (nome, especialidade, cidades atendidas, avaliações) publicamente na Plataforma, quando você optar por criar um perfil profissional.</li>
                <li>Cumprir obrigações legais e responder a solicitações de autoridades competentes.</li>
                <li>Prevenir fraudes e uso indevido da Plataforma.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Com quem compartilhamos seus dados</h2>
              <p>
                Dados de contato e identificação são compartilhados apenas entre as partes envolvidas em uma
                negociação (cliente e profissional) na medida necessária para viabilizar o serviço. Não
                vendemos seus dados pessoais a terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Armazenamento e segurança</h2>
              <p>
                Senhas são armazenadas de forma criptografada (hash), nunca em texto plano. Documentos e
                imagens enviados por você (como o cartão CNPJ) ficam armazenados em servidor próprio e são
                acessíveis apenas por meio de um endereço não previsível.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Seus direitos como titular de dados (LGPD)</h2>
              <p>Você pode solicitar a qualquer momento:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
                <li>Exclusão dos seus dados pessoais, ressalvadas obrigações legais de retenção.</li>
                <li>Portabilidade dos seus dados a outro fornecedor de serviço.</li>
                <li>Revogação do consentimento, quando aplicável.</li>
              </ul>
              <p>Solicitações podem ser feitas pelo canal de contato indicado no rodapé do site.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Cookies</h2>
              <p>
                Utilizamos um cookie de sessão estritamente necessário para manter você autenticado na
                Plataforma. Ele não é usado para rastreamento publicitário.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Alterações desta política</h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Alterações relevantes serão
                comunicadas pela Plataforma antes de entrarem em vigor.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PoliticaDePrivacidade;
