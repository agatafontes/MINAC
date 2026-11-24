
const containerProdutos = document.querySelector('#produtos-container');
var produtos = [];

async function carregarDestaquesAPI() {
    const containerDestaques = document.querySelector('#produtos-destaque');

    if (!containerDestaques) return;

    try {
        const resposta = await fetch('https://fakestoreapi.com/products');
        produtos = await resposta.json();

        containerDestaques.innerHTML = '';

        produtos.slice(0, 5).forEach(produto => {
            const cardHtml = `
                <article class="produto-mini">
                    <img src="${produto.image}" alt="${produto.title}">
                    <h3>${produto.title}</h3>
                    <p>${produto.description}</p>
                    <b>${Number(produto.price).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    })}</b>
                </article>
            `;

            containerDestaques.innerHTML += cardHtml;
        });

    } catch (error) {
        console.log(error);
        containerDestaques.innerHTML = 'Não foi possível carregar os produtos.';
    }
}

async function carregarProdutos() {
    try {
        const resposta = await fetch('produtos.json');

        if (!resposta.ok) {
            throw new Error('Erro ao carregar produtos');
        }

        produtos = await resposta.json();

        criarCardProduto(produtos);

    } catch (error) {
        console.log(error);

        if (containerProdutos) {
            containerProdutos.innerHTML =
                'Não foi possível carregar os produtos.'
        }
    }
}
function filtrarPorCategoria(categoriaEscolhida) {
    if (categoriaEscolhida === 'todos') {
        criarCardProduto(produtos);
        return;
    }

    const produtosFiltrados = produtos.filter(produto =>
        produto.category === categoriaEscolhida
    );

    criarCardProduto(produtosFiltrados);
}

function filtrarPorNome(pesquisa) {
    const texto = pesquisa.toLowerCase();

    const produtosPesquisados = produtos.filter(produto =>
        produto.title?.toLowerCase().includes(texto)
    );

    criarCardProduto(produtosPesquisados);
}

function criarCardProduto(listaProdutos) {
    if (!containerProdutos) return;

    containerProdutos.innerHTML = '';

    if (listaProdutos.length === 0) {
        containerProdutos.innerHTML = 'Nenhum produto encontrado.';
        return;
    }

    listaProdutos.forEach(produto => {
        const cardHtml = `
            <div
                style="background: white; border: 1px solid var(--border-color); border-radius: 6px; padding: 15px; width: 220px; display: flex; flex-direction: column;">

                <div
                    style="background: #f0f0f0; height: 140px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #666;">

                    <img src="${produto.image}" alt="${produto.title}" style="width: 100%; height: 100%; object-fit: cover;">

                </div>

                <h4 style="font-size: 14px; color: var(--text-charcoal);">
                    ${produto.title}
                </h4>

                <p style="font-size: 15px; font-weight: bold; color: var(--primary-bordeaux);">
                    R$ ${produto.price.toFixed(2)}
                </p>

                <span>${produto.category}</span>

                <button class="btn-primary" style="width: 100%; padding: 8px; font-size: 13px;">
                    Comprar
                </button>
            </div>
        `;

        containerProdutos.innerHTML += cardHtml;
    });
}


document.addEventListener('DOMContentLoaded', () => {
    carregarDestaquesAPI();
    carregarProdutos();
});
