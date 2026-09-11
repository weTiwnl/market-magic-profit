# Profit Compass

PROMPT — PWA CALCULADORA DE LUCRO PARA MARKETPLACES

Crie um PWA responsivo, moderno e profissional chamado VendaCalc, focado em vendedores de marketplaces como Shopee e Mercado Livre.

O objetivo principal é permitir que o usuário informe o custo de um produto, preço de venda e todos os custos envolvidos na venda, calculando automaticamente:

Lucro bruto

Lucro líquido

Margem de lucro

Percentual de custos

Valor recebido pelo vendedor

Total de taxas

Impostos

Custo de anúncio/destaque

Frete, quando aplicável

Comissão do marketplace

Preço mínimo para não ter prejuízo

Preço ideal de venda

Quanto precisa vender para atingir determinado lucro

A interface deve ser extremamente simples, rápida e visual, permitindo fazer uma simulação em poucos segundos.

1. TECNOLOGIA

Criar como:

PWA instalável

Responsivo para celular, tablet e desktop

Funcionar offline para os cálculos básicos

React + TypeScript + Vite

Interface moderna

Componentes reutilizáveis

Persistência local dos dados

Preparar arquitetura para futuramente criar extensão Chrome/Edge

Não criar integração automática com contas da Shopee ou Mercado Livre nesta primeira versão.

2. TELA PRINCIPAL

Criar uma calculadora central com os seguintes campos:

PRODUTO

Nome do produto:
[________________________]

Custo do produto:
[R$ ________]

Outros custos:
[R$ ________]

Embalagem:
[R$ ________]

Frete pago pelo vendedor:
[R$ ________]

Preço de venda:
[R$ ________]

Quantidade:
[ 1 ]

3. MARKETPLACE

Criar seleção:

Marketplace:

○ Shopee
○ Mercado Livre
○ Venda própria
○ Personalizado

Quando o usuário selecionar Shopee ou Mercado Livre, mostrar os campos relacionados às taxas.

Permitir que o usuário altere manualmente as taxas, pois elas podem variar conforme categoria, campanha, tipo de anúncio, reputação, modalidade de envio etc.

IMPORTANTE:

Não assumir uma taxa fixa universal para Shopee ou Mercado Livre.

Criar um sistema de configuração onde o usuário possa informar:

Comissão do marketplace:
[ ___ % ]

Taxa fixa por venda:
[R$ ___]

Taxa adicional:
[ ___ % ]

Outras taxas:
[R$ ___]

4. DESTAQUE / PUBLICIDADE

Criar uma seção:

ANÚNCIO / DESTAQUE

Pergunta:

"Você vai pagar para destacar/anunciar este produto?"

○ Não
○ Sim

Se SIM:

Tipo:

○ Valor fixo
○ Percentual sobre a venda

Valor:

[R$ ______]

ou

[____ %]

Permitir cadastrar diferentes custos de publicidade.

Exemplo:

Produto vendido por R$ 100

Publicidade:
R$ 10

O cálculo deve descontar esses R$ 10 do resultado.

5. IMPOSTOS

Criar seção:

IMPOSTOS

Tipo:

○ Percentual sobre a venda
○ Valor fixo

Imposto:

[ ___ % ]

Permitir salvar uma configuração de imposto padrão.

Exemplo:

Preço de venda: R$ 100
Imposto: 6%

Imposto = R$ 6

Esse valor deve ser descontado do faturamento.

IMPORTANTE:

Deixar claro visualmente que o aplicativo faz uma simulação financeira e que a alíquota correta depende do regime tributário e da situação do vendedor.

6. CÁLCULO PRINCIPAL

Após preencher os dados, mostrar um grande painel de resultado:

RESULTADO DA VENDA

Preço de venda:
R$ 100,00

Custo do produto:

R$ 50,00

Marketplace:

R$ 15,00

Imposto:

R$ 6,00

Publicidade:

R$ 5,00

Embalagem:

R$ 2,00

Frete:

R$ 5,00

VALOR LÍQUIDO RECEBIDO:
R$ 67,00

LUCRO LÍQUIDO:
R$ 17,00

MARGEM LÍQUIDA:
17%

7. FÓRMULA

Criar um motor de cálculo transparente.

Faturamento bruto:

Preço de venda × quantidade

Taxa marketplace:

Preço de venda × percentual da comissão

Taxa fixa:

Valor configurado

Imposto:

Preço de venda × percentual do imposto

Publicidade:

Valor configurado ou percentual da venda

Custo total:

Custo do produto

embalagem

frete

comissão

taxas

impostos

publicidade

outros custos

Lucro líquido:

Faturamento bruto - custo total

Margem líquida:

Lucro líquido ÷ faturamento bruto × 100

IMPORTANTE:

Evitar arredondamentos intermediários. Fazer os cálculos com precisão e arredondar somente na apresentação final.

8. PREÇO MÍNIMO

Criar uma função:

"QUAL O MENOR PREÇO QUE POSSO VENDER?"

O usuário informa:

Custo do produto:
R$ 50

Taxas:
15%

Imposto:
6%

Publicidade:
R$ 5

Frete:
R$ 5

Lucro desejado:
R$ 10

O sistema calcula automaticamente o preço mínimo necessário para atingir esse lucro.

Mostrar:

"Para obter R$ 10,00 de lucro líquido, seu preço mínimo deve ser aproximadamente R$ XX,XX."

9. PREÇO IDEAL

Criar uma segunda calculadora:

"QUAL PREÇO DEVO COBRAR?"

Campos:

Custo do produto
Taxas
Impostos
Frete
Publicidade
Outros custos
Margem de lucro desejada

Exemplo:

Margem desejada:
[ 20 % ]

Resultado:

Preço recomendado:
R$ XXX,XX

Lucro estimado:
R$ XX,XX

Margem:
20%

10. SIMULAÇÃO DE PREÇOS

Criar uma tabela comparativa automática:

PreçoTaxasImpostosCustosLucroMargemR$ 80R$ XXR$ XXR$ XXR$ XXXX%R$ 90R$ XXR$ XXR$ XXR$ XXXX%R$ 100R$ XXR$ XXR$ XXR$ XXXX%R$ 110R$ XXR$ XXR$ XXR$ XXXX%R$ 120R$ XXR$ XXR$ XXR$ XXXX%

Permitir configurar o intervalo.

Exemplo:

Preço inicial:
R$ 50

Preço final:
R$ 200

Incremento:
R$ 5

11. COMPARAÇÃO SHOPEE X MERCADO LIVRE

Criar uma função extremamente útil:

"ONDE É MAIS LUCRATIVO VENDER?"

O usuário informa uma única vez:

Produto:
Custo:
R$ 50

Preço:
R$ 100

Depois o sistema calcula simultaneamente:

SHOPEE

Comissão:
R$ XX

Impostos:
R$ XX

Publicidade:
R$ XX

Outros custos:
R$ XX

Lucro líquido:
R$ XX

Margem:
XX%

MERCADO LIVRE

Comissão:
R$ XX

Impostos:
R$ XX

Publicidade:
R$ XX

Outros custos:
R$ XX

Lucro líquido:
R$ XX

Margem:
XX%

Mostrar visualmente:

🏆 MELHOR OPÇÃO

"Mercado Livre gera R$ XX a mais de lucro por venda."

12. CONFIGURAÇÕES DOS MARKETPLACES

Criar uma área:

CONFIGURAÇÕES

SHOPEE

Comissão padrão:
[ ___ % ]

Taxa fixa:
[R$ ___]

Publicidade:
[ ___ % ]

Outros custos:
[R$ ___]

MERCADO LIVRE

Comissão padrão:
[ ___ % ]

Taxa fixa:
[R$ ___]

Publicidade:
[ ___ % ]

Outros custos:
[R$ ___]

Permitir criar diferentes perfis.

Exemplo:

"Mercado Livre — Anúncio Clássico"

"Mercado Livre — Anúncio Premium"

"Shopee — Venda Normal"

"Shopee — Campanha"

O usuário poderá escolher o perfil durante a simulação.

13. ALERTAS INTELIGENTES

Criar alertas visuais.

Se lucro for negativo:

🔴 PREJUÍZO

"Você perderá R$ XX,XX nesta venda."

Se lucro for muito baixo:

🟡 ATENÇÃO

"Sua margem líquida é de apenas X%."

Se margem for boa:

🟢 VENDA RENTÁVEL

"Esta venda gera R$ XX,XX de lucro líquido."

Também mostrar:

"Você precisa vender por pelo menos R$ XX para não ter prejuízo."

14. DASHBOARD

Criar uma página Dashboard com:

Vendas simuladas
Lucro potencial
Margem média
Produto mais rentável
Marketplace mais rentável

Cards:

💰 Lucro estimado
📦 Produtos simulados
📈 Margem média
🏆 Marketplace mais lucrativo

Criar gráficos simples:

Lucro por produto

Margem por produto

Shopee x Mercado Livre

Evolução do preço x lucro

15. HISTÓRICO

Salvar as simulações.

Cada registro deve mostrar:

Produto
Data
Marketplace
Preço
Custo
Lucro líquido
Margem

Exemplo:

RTX 5060
Mercado Livre
Venda: R$ 2.999
Lucro: R$ 412
Margem: 13,7%

Permitir:

Editar

Duplicar

Excluir

Refazer cálculo

16. PRODUTOS FAVORITOS

Permitir salvar produtos.

Exemplo:

"Mouse Logitech"

Custo:
R$ 120

Preço:
R$ 199

Marketplace:
Mercado Livre

Ao abrir o produto, recalcular automaticamente com as configurações atuais.

17. EXTENSÃO FUTURA

Preparar o código para futuramente transformar o sistema em uma extensão Chrome/Edge.

A extensão deverá futuramente permitir que o usuário esteja visualizando um produto em um marketplace e abra um painel lateral com:

Preço do produto
Custo informado pelo usuário
Taxas estimadas
Impostos
Lucro líquido
Margem

IMPORTANTE:

Nesta primeira versão NÃO implementar scraping nem integração automática.

Apenas deixar a arquitetura preparada.

18. DESIGN

Visual profissional semelhante a ferramentas SaaS financeiras.

Usar:

Layout limpo

Cards

Ícones

Gráficos

Campos grandes

Botões claros

Responsividade

Dark mode

Light mode

Priorizar usabilidade.

No celular, a calculadora deve funcionar perfeitamente com uma mão.

Criar navegação:

🏠 Dashboard
🧮 Calculadora
📦 Produtos
📊 Simulações
⚙️ Configurações

19. EXPERIÊNCIA DO USUÁRIO

A calculadora deve atualizar os resultados instantaneamente enquanto o usuário digita.

Exemplo:

Usuário altera preço:

R$ 100 → R$ 110

Todos os valores devem atualizar imediatamente.

Mostrar também o impacto:

"Se aumentar o preço em R$ 10, seu lucro aumenta em R$ X."

Criar botão:

"MAXIMIZAR LUCRO"

que sugere um preço baseado nos custos e na margem desejada.

20. IMPORTANTE SOBRE TAXAS

Não colocar taxas fixas inventadas como se fossem regras oficiais da Shopee ou Mercado Livre.

Criar todas as taxas como campos configuráveis.

O sistema deve permitir:

Comissão %

Taxa fixa

Imposto %

Frete

Publicidade

Outros custos

Desconto

Cupom

Custo de embalagem

Custo operacional

Também permitir ativar/desativar cada custo.

21. EXEMPLO DE SIMULAÇÃO

Produto:

Mouse Gamer

Custo:
R$ 100

Preço de venda:
R$ 199

Comissão:
15%

Imposto:
6%

Publicidade:
R$ 10

Embalagem:
R$ 3

Frete:
R$ 8

Calcular:

Faturamento:
R$ 199

Comissão:
R$ 29,85

Imposto:
R$ 11,94

Publicidade:
R$ 10

Embalagem:
R$ 3

Frete:
R$ 8

Custo produto:
R$ 100

Custo total:
R$ 162,79

Lucro líquido:
R$ 36,21

Margem líquida:
18,20%

22. EXPORTAÇÃO

Permitir exportar as simulações para:

CSV

Excel

PDF

Também permitir compartilhar o resultado pelo celular.

23. ARQUITETURA

Separar claramente:

/components
/pages
/services
/calculators
/marketplaces
/hooks
/utils
/types

Criar um serviço central:

calculateProfit()

que receba todos os custos e retorne:

{
grossRevenue,
marketplaceFee,
fixedFee,
tax,
advertising,
shipping,
packaging,
otherCosts,
totalCosts,
netRevenue,
netProfit,
netMargin,
breakEvenPrice
}

Criar testes para o motor de cálculo para evitar erros financeiros.

24. RESULTADO FINAL

O aplicativo deve parecer um produto comercial pronto para ser lançado.

Nome:

VENDA CALC

Slogan:

"Venda pelo preço certo. Saiba quanto realmente sobra."

Prioridade máxima:

Precisão dos cálculos

Facilidade de uso

Visualização clara do lucro líquido

Configuração das taxas

Comparação Shopee x Mercado Livre

Cálculo de preço mínimo

Cálculo de preço ideal

Histórico de simulações

PWA instalável

Arquitetura preparada para extensão

Antes de finalizar, testar diferentes cenários:

Venda com lucro

Venda com prejuízo

Venda sem publicidade

Venda com publicidade

Taxa fixa

Taxa percentual

Imposto

Frete

Desconto

Cupom

Diferentes quantidades

Garantir que nenhum custo seja contado duas vezes e que todos os valores sejam atualizados corretamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/597aecad-bbfc-49d5-a279-486f23461a55).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
