# Brigada Ambiental - Plataforma de Gestão Ambiental

Sistema operacional da brigada ambiental integrado com a plataforma SementeToken.

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- NPM ou Yarn

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js
│   ├── auth/              # Autenticação
│   ├── dashboard/         # Dashboards
│   ├── site/              # Site institucional
│   └── mapa/              # Mapa interativo
├── components/            # Componentes React
│   ├── auth/              # Componentes de autenticação
│   ├── dashboard/         # Componentes do dashboard
│   ├── site/              # Componentes do site
│   ├── tasks/              # Componentes de tarefas
│   ├── chat/               # Componentes do chat
│   └── map/                # Componentes do mapa
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários
├── services/              # Serviços de API
├── types/                 # Tipos TypeScript
└── utils/                 # Funções utilitárias
```

## 🔧 Funcionalidades

### Fase 1 - Implementadas

✅ Site institucional com páginas de Home, Sobre, Projetos e Contato
✅ Sistema de autenticação com JWT
✅ Dashboard Administrador
✅ Dashboard Brigadista
✅ Sistema de tarefas
✅ Registro de ações com foto e GPS
✅ Chat com IA
✅ Mapa interativo com Leaflet
✅ Gerenciamento de brigadistas

## 🎯 Papeis e Permissões

- **ADMIN_BRIGADA**: Acesso total ao sistema
- **COMANDANTE**: Gerenciamento de equipes e tarefas
- **SUPERVISOR**: Supervisão de atividades
- **BRIGADISTA**: Execução de tarefas e registro de ações

## 🔗 Integração com SementeToken

A plataforma consome a API existente do SementeToken para:

- Autenticação e autorização
- Gerenciamento de usuários
- Gestão de brigadas
- Registro de ações
- Chat com IA

## 🚀 Próximos Passos

- [ ] Integração com câmeras e sensores
- [ ] Sistema de notificações push
- [ ] Relatórios detalhados
- [ ] App mobile
- [ ] Integração com drones

## 📞 Suporte

Para dúvidas e suporte, entre em contato através do email: contato@brigadaambiental.org