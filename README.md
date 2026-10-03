# Planejamento do 4º bimestre

Aplicativo estático de Ciências Humanas: História do 9º ano e História, Filosofia e Sociologia da 1ª à 3ª série, com 60 semanas.

## Uso

1. Escolha a turma e a disciplina.
2. Selecione a semana.
3. Use Preparar aula, Caderno dos alunos ou Atividade.
4. Projetar, Editar aula, Imprimir e Marcar como dada ficam na aula. No celular, ficam na barra inferior.

Editar aula salva alterações de texto no título, caderno e atividade. Minhas anotações mantém os campos anteriores separados da projeção. Restaurar original mantém as anotações; Desfazer permite recuperar a edição anterior na mesma sessão.

Mais opções oferece progresso de todas as turmas, cópia de segurança, sincronização, leitura facilitada e impressão de conjuntos de aulas.

## Arquivos

- `index.html`: conteúdo pedagógico, armazenamento e projeção existentes.
- `planner-core.js`: validação de edições de texto e seleção de semanas.
- `planner-ux.js`: navegação por turma e semana, abas, edição, marcações e impressão.
- `planner-ux.css`: apresentação para computador, celular e impressão.
- `manifest.webmanifest` e `icones/`: metadados e ícones de instalação. Não há service worker; instalação não garante funcionamento offline.
- `Notas_de_revisao_4Bimestre.html`: histórico de revisão do conteúdo.
- `Atividades_4Bimestre_para_impressao.pdf`: PDF estático anterior; as edições feitas no aplicativo aparecem na impressão do aplicativo, não nesse arquivo.

## Dados e compatibilidade

Os 391 campos anteriores conservam os identificadores e as chaves `malu-`. Há 60 campos adicionais, um por semana, contendo edições de texto em JSON. O backup de versão 3 inclui os 451 campos e as aulas dadas. Backups antigos continuam aceitos e não apagam campos ausentes.

As edições guardam caminhos de elementos e texto simples, nunca HTML executável. Diagramas, tabelas e conteúdo não editado são preservados. Mudanças posteriores na estrutura do conteúdo exigem conferir a compatibilidade desses caminhos.

A sincronização Firebase já existia no repositório e continua opcional. O endereço padrão fica em Configuração avançada. Ela usa o código compartilhado e depende de conectividade e das regras do banco; não é um sistema de login. Preferências de navegação ficam locais.

## Verificação

```sh
npm install --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

A suíte verifica navegação, turma real, abas, edição segura, projeção, persistência, cancelamento, desfazer, busca em semanas ocultas, backups, impressão e largura de celular. Firebase é simulado nos testes; eles não escrevem no banco de produção. O workflow gera capturas de tela, PDF e backup de teste em artefato temporário. A sincronização real entre dois aparelhos precisa ser verificada com dados de teste e configuração válida.

## Segunda rodada de usabilidade

Os códigos BNCC e da Matriz SEDUC-GO ficam no rodapé permanente de cada caderno dos alunos, incluindo projeção e impressão. A opção Fontes e QR codes controla apenas as referências adicionais. Códigos não preenchidos no planejamento são sinalizados sem acrescentar habilidades por suposição. O texto de uma habilidade da Matriz pode ser aberto pelo código quando já consta do dicionário do aplicativo.

A aba escolhida é mantida ao navegar pelas semanas e reabrir o aplicativo. O cabeçalho mostra o progresso da turma na disciplina. Os testes adicionais percorrem todas as 60 semanas na largura de um celular e verificam os códigos, edição anterior, impressão, abas e progresso.
