# Planejamento do 4º bimestre

Aplicativo estático de Ciências Humanas: História do 9º ano e História, Filosofia e Sociologia da 1ª à 3ª série, com 60 semanas.

## Uso

1. Escolha a série e a disciplina.
2. Selecione a semana.
3. Use Preparar aula, Caderno dos alunos ou Atividade.
4. Preparar / estudar e Projetar quadro ficam nos acessos diretos. Editar aula, Imprimir e Marcar como dada ficam na aula.

Editar aula salva alterações de texto no título, caderno e atividade. Minhas anotações mantém os campos anteriores separados da projeção. Restaurar original mantém as anotações; Desfazer permite recuperar a edição anterior na mesma sessão.

Mais opções oferece progresso de todas as turmas, cópia de segurança, sincronização, leitura facilitada e impressão de conjuntos de aulas.

## Arquivos

- `index.html`: estrutura da interface, seletores, janelas e dicionário curricular.
- `assets/css/planner-base.css`: estilos originais de leitura, cadernos, projeção e impressão, na mesma ordem de aplicação.
- `assets/js/dados-bimestre.js`: conteúdo pedagógico do bimestre, com o HTML original preservado em um objeto versionado.
- `assets/js/planner-content.js`: montagem do conteúdo antes da inicialização das ferramentas.
- `assets/js/storage-fallback.js` e `storage-backup.js`: disponibilidade de armazenamento, anotações e backups.
- `assets/js/reading-preferences.js`: preferências de leitura.
- `assets/js/projection.js`: projeção dos materiais dos alunos.
- `assets/js/lesson-progress.js`: registro de aulas dadas.
- `assets/js/activity-print.js`: impressão de atividades.
- `assets/js/sync.js`: sincronização opcional entre aparelhos.
- `planner-core.js`: validação de edições de texto e seleção de semanas.
- `planner-ux.js`: navegação por série e semana, abas, edição, marcações e impressão.
- `planner-ux.css`: apresentação para computador, celular e impressão.
- `planner-theme.css`: acabamento visual da interface em tela, sem modificar o caderno pedagógico nem a impressão.
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

A suíte verifica navegação, seleção por série, abas, edição segura, projeção, persistência, cancelamento, desfazer, marcações independentes por turma, backups, impressão e largura de celular. Firebase é simulado nos testes; eles não escrevem no banco de produção. O workflow gera capturas de tela, PDF e backup de teste em artefato temporário. A sincronização real entre dois aparelhos precisa ser verificada com dados de teste e configuração válida.

## Segunda rodada de usabilidade

Os códigos BNCC e da Matriz SEDUC-GO ficam no rodapé permanente de cada caderno dos alunos, incluindo projeção e impressão. A opção Fontes e QR codes controla apenas as referências adicionais. Códigos não preenchidos no planejamento são sinalizados sem acrescentar habilidades por suposição. O texto de uma habilidade da Matriz pode ser aberto pelo código quando já consta do dicionário do aplicativo.

A aba escolhida é mantida ao navegar pelas semanas e reabrir o aplicativo. O cabeçalho mostra o progresso da turma na disciplina. Os testes adicionais percorrem todas as 60 semanas na largura de um celular e verificam os códigos, edição anterior, impressão, abas e progresso.

## Material de apoio para estudo e projeção

Preparar / estudar abre a preparação com fundamentação e conteúdo curricular expandidos. Projetar quadro abre o caderno da semana selecionada. A última série, disciplina e semana são retomadas ao abrir o aplicativo. Voltar da projeção mantém a aba da professora.

Problematização, Conteúdo, Quadro, Atividade e Fontes são materiais independentes, escolhidos diretamente. Não há sequência, contagem de etapas ou obrigação de usar atividades. A troca de semana preserva o tipo de material escolhido. As seis semanas continuam acessíveis pelo seletor e pelos botões de semana.

Fontes oferece os links já cadastrados, sem depender dos QR codes nem de rolar até o fim do quadro. Os links abrem em outra aba; ao retornar, a aula permanece aberta. Alternar entre Quadro e Fontes preserva a posição de leitura. Ajustes reúne tamanho das letras, referências no rodapé e impressão. As fontes dependem de internet e da disponibilidade dos sites externos.

No celular, somente os dois acessos diretos ficam fixos; a navegação completa e as ações de edição/impressão rolam com a página. A fundamentação e as respostas da professora não entram na projeção dos materiais dos alunos.

A área principal começa na aula selecionada. O cartão redundante “Pronto para projetar” foi removido; progresso, sincronização e ajuda ficam em Mais opções. A trilha continua visível após a aula, com acesso direto por Ver trilha. O resultado da busca aparece na área principal somente durante uma busca.

## Modularização interna

O HTML principal passou de 1.217.289 para 59.664 bytes. Os textos foram extraídos integralmente, sem alterar IDs, chaves de salvamento, links, desenhos ou a estrutura usada pelas edições. Os scripts clássicos mantêm a ordem e o ponto de inicialização anteriores; os estilos mantêm sua ordem de aplicação.

Esta etapa separa conteúdo, estilos e funções sem acrescentar telas ou cliques. Todo o conteúdo ainda é montado na abertura para manter busca, backups, sincronização e impressão de conjuntos disponíveis. Não é lazy loading: o volume total transferido e o DOM não diminuem por essa extração. Os arquivos separados podem ser reutilizados pelo cache HTTP do navegador, conforme as respostas da hospedagem. Não foi acrescentada garantia de acesso offline.

## Seleção por série e aplicação por turma

O topo oferece somente Série e Disciplina, sem campo de busca. Cada aula traz caixas de seleção com os nomes das turmas da série. Marcar ou desmarcar uma turma conserva os registros das demais e usa as mesmas chaves de aula e turma dos backups anteriores. A data registrada continua disponível no título da caixa e no painel Progresso das turmas. A série, disciplina e semana anteriores continuam sendo retomadas, inclusive a partir da preferência antiga que incluía a turma.

## Glossários por aula

A preparação de todas as 60 semanas tem um Glossário da aula expandido, reunindo definições já existentes no material. Em Estética e Filosofia da Arte e Arte e Sociedade, o glossário foi complementado com definições de trabalho, exemplos e referências consultáveis; os sentidos específicos de Kant e Benjamin são identificados. O componente fica na preparação da professora e não entra nas projeções nem na impressão do caderno dos alunos. O texto original dos cadernos e a estrutura usada pelas edições anteriores permanecem intactos. `assets/js/planner-glossary.js` reúne essa lógica e os complementos de arte.
