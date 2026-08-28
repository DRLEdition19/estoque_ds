# 📱 Estoque & Inventário Online - PWA (Progressive Web App)

Seu sistema agora é um **aplicativo web instalável**! Isso permite que usuários instalem seu site como um app nativo no celular.

## ✅ O que foi configurado

### 1. **manifest.json** ✓
- Define as informações do app (nome, descrição, cores, ícones)
- Permite instalação como app standalone
- Funciona em Android e iOS

### 2. **service-worker.js** ✓
- Ativa o funcionamento offline
- Faz cache dos arquivos principais
- Estratégia de rede: tenta online primeiro, usa cache se falhar

### 3. **index.html** ✓
- Vinculado ao manifest.json
- Registra o Service Worker
- Inclui meta tags de PWA

### 4. **.htaccess** ✓
- Ativa compressão de arquivos
- Configura cache do navegador
- Melhora performance

## 🚀 Como usar no celular

### **Android (Chrome, Edge, Samsung Internet)**
1. Acesse seu sistema no celular
2. Toque no menu (⋮) ou pressione a barra de pesquisa
3. Procure por **"Instalar app"** ou **"Adicionar à tela inicial"**
4. Confirme a instalação
5. Pronto! Abre como um app nativo!

### **iPhone/iPad (Safari)**
1. Acesse seu sistema no Safari
2. Toque no botão **Compartilhar** (seta para cima)
3. Role e toque em **"Adicionar à tela inicial"**
4. Escolha o nome e confirme
5. Pronto! Abre como um app nativo!

## 🎨 Customizar o App

Para mudar o nome, cor ou ícone, edite o arquivo `manifest.json`:

```json
{
  "name": "Seu Nome Aqui",           // Nome completo do app
  "short_name": "Seu Nome",           // Nome curto (máx. 12 caracteres)
  "theme_color": "#1a1a1a",           // Cor da barra do navegador
  "background_color": "#ffffff",      // Cor de carregamento
  "icons": [
    {
      "src": "/estoque_ds/icon-192.png",  // Caminho do ícone 192x192
      "sizes": "192x192"
    }
  ]
}
```

## 🖼️ Adicionar ícones do app

Você pode usar qualquer imagem como ícone. Recomenda-se:
- **icon-192.png** (192x192 pixels)
- **icon-512.png** (512x512 pixels)

Depois faça upload dos arquivos para o repositório nas raízes do projeto.

## 🔧 Verificar se está funcionando

1. Abra o DevTools do navegador (F12)
2. Vá em **Application** → **Manifest**
3. Verifique se os dados aparecem corretamente
4. Vá em **Service Workers** e confirme se está registrado

## 📊 Requisitos atendidos para PWA

- ✅ HTTPS (GitHub Pages fornece automaticamente)
- ✅ Manifest.json válido
- ✅ Service Worker registrado
- ✅ Ícone do app configurado
- ✅ Display standalone (sem barra de navegação)

## 🎯 Próximos passos (opcional)

1. **Adicionar ícones personalizados** - Substitua os caminhos em `manifest.json`
2. **Customizar cores** - Mude `theme_color` e `background_color`
3. **Adicionar screenshots** - Para mostrar o app na loja de apps
4. **Testar offline** - Desative internet e veja funcionar!

---

**Seu sistema agora está pronto para ser instalado como app! 🎉**
