// Banner "Instale o RTQuímico no celular", no topo do painel (só depois do login). Regras em src/lib/instalar-app.ts.
import { Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { adiarBanner, aoMudarInstalacao, aparelhoDe, mostrarBannerAgora, pedirInstalacao, temPedidoInstalacao } from "../lib/instalar-app";

export function InstalarApp() {
  const [visivel, setVisivel] = useState(mostrarBannerAgora);
  const [podePedir, setPodePedir] = useState(temPedidoInstalacao);

  useEffect(
    () => aoMudarInstalacao(() => {
      setPodePedir(temPedidoInstalacao());
      setVisivel(mostrarBannerAgora());
    }),
    [],
  );

  if (!visivel) return null;

  const iphone = aparelhoDe(navigator.userAgent, navigator.maxTouchPoints ?? 0) === "iphone";
  const agoraNao = () => {
    adiarBanner();
    setVisivel(false);
  };

  return (
    <section className="instalar-app" aria-labelledby="instalar-app-titulo">
      <span className="instalar-app-icone"><Smartphone size={22} /></span>
      <div>
        <strong id="instalar-app-titulo">Instale o RTQuímico no celular</strong>
        {podePedir && <p>Abra direto da tela inicial, em tela cheia, como um aplicativo. Sem passar pela loja de aplicativos.</p>}
        {!podePedir && iphone && <p>No Safari, toque em <b>Compartilhar</b> <Share size={15} aria-label="(ícone de compartilhar)" /> na barra de baixo e depois em <b>Adicionar à Tela de Início</b>.</p>}
        {!podePedir && !iphone && <p>No menu <b>⋮</b> do navegador, toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p>}
      </div>
      <div className="instalar-app-botoes">
        <button type="button" className="button ghost" onClick={agoraNao}>Agora não</button>
        {podePedir && <button type="button" className="button primary" onClick={() => void pedirInstalacao()}>Instalar</button>}
      </div>
    </section>
  );
}
