# Declaração de Segurança e Confiabilidade do Portal Comercial

Este documento tem como objetivo apresentar de forma transparente, clara e sincera as medidas de segurança, infraestrutura e boas práticas de engenharia de software adotadas na construção do nosso Portal Comercial. Nosso compromisso é garantir a todos os usuários que os dados, acessos e operações realizadas aqui estão protegidos pelas tecnologias mais modernas e confiáveis do mercado.

---

## 1. Segurança do Banco de Dados e Autenticação (Supabase)

O coração dos nossos dados e o controle rigoroso de quem pode acessar o portal são gerenciados pelo **Supabase**, uma plataforma de *Backend-as-a-Service* reconhecida mundialmente, construída sobre o robusto e consagrado banco de dados relacional **PostgreSQL**.

* **Nenhuma senha é salva em texto:** Nós **nunca** armazenamos ou temos acesso às senhas reais dos usuários. Quando uma senha é criada, o sistema a transforma em um código embaralhado e irreversível (usando técnicas criptográficas de *hashing* avançado). Mesmo no caso extremo de um vazamento de banco de dados, as senhas continuariam protegidas e ilegíveis.
* **Autenticação via Tokens (JWT):** O sistema não baseia-se em mecanismos frágeis para "lembrar" o usuário. Utilizamos *JSON Web Tokens* (JWT), o padrão ouro da indústria para autenticação moderna. Ao logar, o usuário recebe um token digital criptografado e temporário. É esse "crachá digital" que valida cada ação interna, sem expor dados sensíveis na rede.
* **Recuperação Segura de Acesso:** O fluxo de "Esqueci minha senha" é processado integralmente pelos servidores seguros do Supabase, que geram e enviam links temporários, únicos e criptografados direto para o e-mail cadastrado, neutralizando tentativas de interceptação.

## 2. Segurança no Código e Controle de Acessos (Frontend)

O código que roda no navegador foi programado seguindo o "Princípio do Menor Privilégio" e uma clara separação de responsabilidades. Nós escrevemos o sistema para desconfiar de qualquer requisição até que ela prove ter autorização.

* **Controle de Acesso Baseado em Perfis (RBAC):** O portal não se limita a esconder botões visualmente; ele de fato bloqueia o acesso em nível lógico. Existem papéis bem definidos (ex: Comercial, Marketing, Mestre). Sempre que um usuário tenta acessar uma área restrita (como a de Administração), o código do portal valida em tempo real, junto ao banco de dados, se aquele e-mail logado possui a função exata exigida. Caso contrário, o acesso é negado e a pessoa é removida da página instantaneamente.
* **Prevenção contra Injeções Maliciosas:** Como toda a comunicação do código com o banco de dados ocorre através das bibliotecas e APIs oficiais do Supabase (ao invés de consultas textuais montadas manualmente), o sistema é estruturalmente imune à grande maioria dos ataques de injeção de código (como o temido *SQL Injection*).
* **Ausência de Credenciais Perigosas Expostas:** Ao inspecionar o código do portal, um profissional de TI verá uma chave de API (`SUPABASE_KEY`). Isso é normal e totalmente seguro: trata-se de uma chave pública *anônima*, projetada estritamente para o navegador. Essa chave sozinha não permite alterar ou deletar dados, pois as Políticas de Segurança de Linha (RLS) do banco de dados exigem o token (o "crachá digital") do usuário validado para liberar qualquer informação crítica.

## 3. Hospedagem e Proteção de Infraestrutura (Netlify)

Nosso portal não está "jogado" em um servidor barato que pode ser facilmente derrubado. Toda a estrutura visual e os arquivos do site são hospedados e servidos pela **Netlify**, uma das maiores e mais respeitadas plataformas globais de infraestrutura em nuvem.

* **Criptografia de Ponta a Ponta (HTTPS Ativo):** Todo o tráfego e dados trafegados entre o computador do usuário e o portal são rigorosamente criptografados. A Netlify emite e gerencia certificados digitais (SSL/TLS) de alta segurança. É tecnicamente impossível navegar no portal sem o "cadeado de segurança" ativo, o que garante que ninguém consiga espionar sua conexão em redes Wi-Fi públicas.
* **Rede de Distribuição Global (CDN) e Defesa de Borda:** Os arquivos do site são replicados em servidores de altíssima velocidade pelo mundo todo. Além da rapidez, essa infraestrutura robusta oferece proteção inerente contra ataques de negação de serviço (DDoS). Tentativas de derrubar o site com acessos falsos massivos são filtradas e bloqueadas automaticamente antes de afetarem os usuários reais.
* **Implantações Imutáveis (Immutability):** O código hospedado no servidor não pode ser invadido e alterado "em tempo real". Cada atualização que publicamos gera uma nova versão trancada a sete chaves. Isso torna impossível que invasores externos modifiquem os arquivos hospedados para distribuir vírus ou golpes através da nossa plataforma.

---

### Resumo do Nosso Compromisso

Construímos o Portal Comercial não apenas com a premissa de entregar praticidade às equipes, mas com o compromisso de que a confiança é inegociável. Aplicamos na prática as mesmas arquiteturas de segurança adotadas pelas grandes corporações de tecnologia global. 

Desde a blindagem do servidor que hospeda as páginas, passando pela inteligência do código que só libera acessos autorizados, até a forte criptografia no armazenamento dos dados: tudo foi planejado para que nossas equipes operem e acessem informações com a máxima tranquilidade e proteção. O sistema é sólido, auditável e 100% seguro contra as ameaças convencionais da internet.
