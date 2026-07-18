# SARC — site de peças, serviços e projetos

Site estático responsivo com catálogo, carrinho, contato direto pelo WhatsApp e painel administrativo local.

## Como abrir

Abra `index.html` no navegador. Para evitar limitações do navegador ao abrir arquivos locais, também é possível executar um servidor simples na pasta:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## WhatsApp

Os botões de projeto, orçamento, serviços, peças e carrinho abrem uma conversa com mensagem pronta para:

```text
(21) 98211-1504
```

O número usado no código é `5521982111504`.

## Administração

Clique em **Usuário** no cabeçalho e use a senha:

```text
123456
```

O painel permite:

- adicionar, editar e remover peças;
- alterar nome, preço, categoria, selo e imagem;
- adicionar, editar, remover e reordenar projetos;
- publicar ou ocultar projetos;
- escolher o projeto em destaque;
- adicionar capa, galeria de imagens e links de vídeo;
- restaurar os conteúdos demonstrativos.

As alterações são salvas em `localStorage`, apenas no navegador atual. A sessão administrativa usa `sessionStorage`.

## Vídeos dos projetos

O editor aceita uma URL por linha. São exibidos diretamente:

- links do YouTube;
- arquivos `.mp4` e `.webm` públicos;
- outros links aparecem como botão para abrir o vídeo.

## Limitação de segurança

A senha está no JavaScript e serve apenas para demonstração. Para publicar a área administrativa de verdade, use backend, autenticação, banco de dados e armazenamento de arquivos.

## Estrutura

```text
sarc-site/
├── index.html
├── README.md
└── assets/
    ├── css/styles.css
    ├── js/app.js
    └── images/
```
