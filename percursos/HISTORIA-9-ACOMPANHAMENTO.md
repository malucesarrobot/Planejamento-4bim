# Acompanhamento de História — 9º ano (4º bimestre de 2026)

## Estado do código

- Página do aluno: `percursos/historia-9ano.html`.
- Banco de atividades: `percursos/historia-9ano-data.js` (6 semanas, 24 questões objetivas, 6 produções escritas).
- Envio e identificação: `percursos/historia-9ano-sync.js`.
- Acompanhamento docente: `percursos/teacher-historia-9ano.js`, carregado por `percursos/professora.html`.
- Regras do banco: `percursos/database.rules.json`.
- Teste automático sem dados reais: `tests/percursos-h9.mjs`.

## Ativação no Firebase

O push do GitHub **não publica as regras do Realtime Database**. No projeto **percursos-754d6**, acessar Firebase Console → Realtime Database → Regras. Antes de publicar, guardar backup das regras atualmente ativas e comparar com `percursos/database.rules.json`. Publicar o JSON completo, preservando as permissões anteriores, e reabrir a aba para conferir. Não substituir regras de outros projetos Firebase.

Conferir em Authentication → Métodos de login se o provedor anônimo está habilitado; o painel docente continua exigindo conta Google autorizada. A configuração de Anonymous Auth também é utilizada pelo Ensino Médio, então não desabilitar indiscriminadamente.

Em `percursos/professora.html`, depois de autenticar, localizar **História — 9º ano · 4º bimestre**. Selecionar 9º A, B ou C, obter link da turma e compartilhar apenas com os estudantes daquela turma. Cada aluno informa nome completo conforme chamada, responde às questões e clica em **Enviar à professora**. A professora verá em tempo real identificados, iniciados, envios, pontuação objetiva, respostas escritas e exportação CSV.

## Conferência prática após publicar

1. Autenticar uma conta docente e gerar o link do **9º A**.
2. Abrir esse link em janela de estudante separada e verificar que a turma exibida é o **9º A**.
3. Registrar um perfil fictício de teste, marcar uma alternativa, confirmar no painel que a semana aparece como **Iniciou**.
4. Completar as quatro respostas e a produção escrita, clicar em **Enviar à professora** e conferir resultado e texto no painel.
5. Conferir a exportação CSV e repetir no **9º B** e **9º C**; depois excluir os perfis fictícios na base, sem tocar nos registros de alunos reais.
6. Confirmar que os relatórios e a sincronização das turmas do Ensino Médio continuam intactos.

## Limites e proteção de dados

- O acompanhamento remoto só funciona após publicação das regras no Firebase. Até lá, as respostas podem ser mantidas localmente.
- Nome informado pelo próprio estudante não substitui a conferência com a chamada oficial. Quem ainda não acessou o link não aparecerá entre os identificados.
- A identidade de envio é vinculada ao Firebase Authentication anônimo do dispositivo. Usar **Trocar estudante** em aparelho compartilhado. Trocar de aparelho sem recuperar a mesma autenticação cria outro cadastro.
- Os resultados de múltipla escolha são apoio formativo; o aplicativo não atribui nota oficial nem lança frequência ou nota no SIAP. A escrita exige avaliação docente.
- Os dados pessoais de estudantes só devem ser consultados por equipe autorizada e não compartilhados publicamente. Não incluir dados reais dos alunos nos testes, commits ou relatórios públicos do GitHub.
