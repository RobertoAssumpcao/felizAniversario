# Uma surpresa para a Gaia ✦

Uma pequena experiência de aniversário com estética de wallpaper noturno, tipografia sóbria, um fantasminha original feito em CSS e uma carta pessoal. HTML, CSS e JavaScript puro, sem instalação, fontes externas, rastreamento ou serviços de terceiros.

## Visualizar

Abra `index.html` diretamente no navegador. Os arquivos `style.css` e `script.js` precisam permanecer ao lado dele. Não é necessário servidor, build ou conexão com a internet.

No celular, abra um endereço de hospedagem estática ou transfira a pasta inteira para um dispositivo que permita abrir HTML local. Para enviar um link, publique **apenas** `index.html`, `style.css`, `script.js` e eventuais imagens autorizadas em uma hospedagem estática de sua escolha. Não publique a pasta inteira do projeto: outros arquivos locais não fazem parte do site.

## Experiência

- **Abrir sua surpresa:** o fantasma atravessa a tela em menos de um segundo com um rastro de estrelas. A carta aparece e recebe o foco. O botão passa a permitir reler a carta.
- **Céu interativo:** toque na lua ou use Enter/Espaço para soltar uma estrela cadente. No desktop, lua e órbitas respondem suavemente ao mouse com uma pequena diferença de profundidade.
- **Fantasminha:** toque ou use Enter/Espaço para revelar “Gaia” em uma constelação desenhada com estrelas, acompanhada de uma pequena dança e um pulso orbital. O céu volta ao normal depois de alguns segundos.
- **Um último detalhe...:** revela o convite do sorvete com estrelas cadentes e algumas partículas leves, uma única vez por visita.
- **Nuvem no rodapé:** abre a brincadeira do Instituto Cobra Coral. Outro toque, um toque fora ou Escape fecha o recado.
- Todas as animações respeitam a configuração de movimento reduzido do sistema. Com ela ativa, a carta e os recados aparecem imediatamente, sem confetes ou deslocamentos animados.
- Sem JavaScript, a carta, o PS e a brincadeira continuam visíveis; os botões interativos são ocultados.

## Personalizar

**Texto e data:** edite `index.html`. A mensagem está no elemento `.letter-content`; o convite fica em `#postscript`; o easter egg, em `#weather-note`. A data é fixa em 9 de outubro, sem contador ou lógica de ano.

**Cores:** altere as variáveis no início de `style.css`. A paleta combina preto, violeta e lilás, com pequenos acentos vermelhos. As fontes são do sistema: títulos sem serifa, texto legível e pequenos detalhes monoespaçados. O site usa ilustrações originais em CSS, sem sprites ou artes oficiais.

**Assinatura:** substitua a frase dentro de `.sign-off` se quiser assinar com seu nome.

**Foto opcional:** o layout é completo sem fotografias. Se desejar, crie `assets/`, coloque ali somente uma imagem autorizada e adicione este trecho dentro de `.letter-content`, antes da assinatura:

```html
<figure class="optional-photo">
  <img src="assets/foto.webp" alt="Descreva a foto escolhida" width="800" height="600" loading="lazy">
</figure>
```

Adicione ao CSS:

```css
.optional-photo { margin: 28px 0; }
.optional-photo img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 10px;
  border: 1px solid var(--line);
}
```

Use as dimensões reais da imagem nos atributos `width` e `height`. Prefira WebP ou JPEG compactado e nomes de arquivo simples. Nenhum arquivo já existente na pasta é carregado automaticamente.

**Metadados:** título, descrição e prévia de compartilhamento ficam no `<head>` do HTML. `noindex, nofollow` expressa a preferência de manter a página fora de buscas; não restringe o acesso a quem tiver o link. Não há informações de contato ou links de redes sociais.

## Verificar

Verificado no Edge local com abertura direta por `file://`, nas resoluções 320 × 568, 360 × 740, 390 × 844, 430 × 932, 768 × 1024 e 1440 × 900. Os testes cobriram ausência de rolagem horizontal, abertura da carta, transferência de foco, toque no fantasma, PS, nuvem, Escape, remoção das partículas, movimento reduzido e leitura sem JavaScript. Não foram detectados erros de execução nem requisições externas. As capturas de celular e desktop também foram inspecionadas visualmente.

Abra a página em 320, 360, 390 e 430 px e também no desktop. Confira o botão da carta, o fantasma, o PS, a nuvem, navegação por Tab e a configuração de movimento reduzido. O CSS organiza as lembranças em linhas no celular e em três colunas a partir de 600 px.

Os efeitos são limitados a poucos elementos e se removem ao terminar. O movimento de profundidade agenda apenas um quadro por atualização do mouse; não há loop permanente. As estrelas e os pulsos animam `transform` e `opacity`; a constelação usa traços SVG. Ao sair da aba, os efeitos em andamento são cancelados. Não há áudio, armazenamento local, formulários ou chamadas de rede.
