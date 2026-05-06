import { Link } from "react-router-dom";
import { ArrowLeft, Package, CreditCard, Truck, Mail } from "lucide-react";

export function ShopHelpPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      <div className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
        <Link
          to="/loja"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-regif-blue hover:underline"
        >
          <ArrowLeft size={16} aria-hidden />
          Voltar à lojinha
        </Link>

        <h1 className="text-2xl font-bold text-regif-dark md:text-3xl">Dúvidas sobre a lojinha</h1>
        <p className="mt-2 text-gray-600">
          Informações rápidas sobre pedidos, pagamento e entrega. Em caso de dúvidas pontuais, fale com a equipe da
          REGIF.
        </p>

        <ul className="mt-10 space-y-8 text-gray-700">
          <li className="flex gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-regif-blue/10 text-regif-blue">
              <Package size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-regif-dark">Como faço um pedido?</h2>
              <p className="mt-1 text-sm leading-relaxed">
                Escolha os produtos, adicione ao carrinho e preencha o formulário em <strong>Finalizar</strong>. O
                pedido é registrado no sistema e a equipe entra em contato para confirmar valores, pagamento e
                retirada ou envio.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-regif-blue/10 text-regif-blue">
              <CreditCard size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-regif-dark">Pagamento</h2>
              <p className="mt-1 text-sm leading-relaxed">
                O pagamento <strong>não é processado automaticamente</strong> neste site. Após o pedido, a equipe da
                REGIF informa as opções disponíveis e confirma quando o pagamento for recebido.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-regif-blue/10 text-regif-blue">
              <Truck size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-regif-dark">Entrega e prazos</h2>
              <p className="mt-1 text-sm leading-relaxed">
                Envio ou retirada são combinados com a equipe após a confirmação do pedido. Prazos e custos de frete
                (quando houver) dependem da disponibilidade e da região.
              </p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-regif-blue/10 text-regif-blue">
              <Mail size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-bold text-regif-dark">Contato</h2>
              <p className="mt-1 text-sm leading-relaxed">
                Para acompanhar um pedido ou esclarecer algo que não esteja aqui, use os canais oficiais da REGIF
                (e-mail e redes sociais indicados no site principal).
              </p>
            </div>
          </li>
        </ul>
        </div>
      </div>
    </div>
  );
}
