// ==========================================
// MINAC - SISTEMA DE PRODUTOS E CARRINHO
// ==========================================

let produtos = [];

const CHAVE_CARRINHO = "minac_carrinho";

const containerProdutos = document.querySelector("#produtos-container");

// ==========================================
// FUNÇÕES DO CARRINHO
// ==========================================

function obterCarrinho() {
    try {
        return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
    } catch {
        return [];
    }
}

function salvarCarrinho(carrinho) {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
    atualizarContador();
}

function adicionarProduto(produto, quantidade = 1) {
    const preco = Number(produto.price);

    if (!produto.id || !produto.title || !Number.isFinite(preco) || preco < 0) {
        alert("Não foi possível adicionar este produto.");
        return;
    }

    const carrinho = obterCarrinho();

    const id = String(produto.id);
    const existente = carrinho.find(item => item.id === id);

    if (existente) {
        existente.quantidade += quantidade;
    } else {
        carrinho.push({
            id,
            nome: produto.title,
            preco,
            imagem: produto.image || "",
            quantidade
        });
    }

    salvarCarrinho(carrinho);

    alert("Produto adicionado ao carrinho!");
}

function atualizarContador() {
    const contador = document.querySelector("#contador-carrinho");

    if (!contador) return;

    const quantidade = obterCarrinho().reduce(
        (total, item) => total + item.quantidade,
        0
    );

    contador.textContent = quantidade;
}

function alterarQuantidade(id, valor) {
    const carrinho = obterCarrinho();

    const item = carrinho.find(item => item.id === String(id));

    if (!item) return;

    item.quantidade += valor;

    const atualizado = carrinho.filter(
        item => item.quantidade > 0
    );

    salvarCarrinho(atualizado);
    renderizarCarrinho();
}

function removerProduto(id) {
    const carrinho = obterCarrinho().filter(
        item => item.id !== String(id)
    );

    salvarCarrinho(carrinho);
    renderizarCarrinho();
}

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

// ==========================================
// MOSTRAR PRODUTOS NO CARRINHO
// ==========================================

function renderizarCarrinho() {
    const container = document.querySelector("#lista-carrinho");

    if (!container) {
        atualizarContador();
        return;
    }

    const carrinho = obterCarrinho();

    if (carrinho.length === 0) {
        container.innerHTML = "<p>Seu carrinho está vazio.</p>";
    } else {
        container.innerHTML = carrinho.map(item => `
            <article class="item-carrinho">

                <img
                    src="${escaparHTML(item.imagem)}"
                    alt="${escaparHTML(item.nome)}"
                    style="width:80px;height:80px;object-fit:contain"
                >

                <div>
                    <h3>${escaparHTML(item.nome)}</h3>

                    <p>${formatarPreco(item.preco)}</p>

                    <div class="quantidade">
                        <button data-acao="diminuir"
                                data-id="${escaparHTML(item.id)}">−</button>

                        <span>${item.quantidade}</span>

                        <button data-acao="aumentar"
                                data-id="${escaparHTML(item.id)}">+</button>
                    </div>
                </div>

                <button data-acao="remover"
                        data-id="${escaparHTML(item.id)}">
                    Remover
                </button>

            </article>
        `).join("");
    }

    const subtotal = carrinho.reduce(
        (total, item) => total + item.preco * item.quantidade,
        0
    );

    const elementoSubtotal = document.querySelector("#subtotal-carrinho");
    const elementoTotal = document.querySelector("#total-carrinho");

    if (elementoSubtotal) {
        elementoSubtotal.textContent = formatarPreco(subtotal);
    }

    if (elementoTotal) {
        const frete = Number(
            document.querySelector("input[name='frete']:checked")?.value || 0
        );
        elementoTotal.textContent = formatarPreco(carrinho.length ? subtotal + frete : 0);
    }

    atualizarContador();
}

// ==========================================
// CARREGAR PRODUTOS DA API
// ==========================================

async function carregarDestaquesAPI() {
    const containerDestaques =
        document.querySelector("#produtos-destaque");

    if (!containerDestaques) return;

    try {
        const resposta = await fetch("https://fakestoreapi.com/products");

        if (!resposta.ok) throw new Error("Erro na API");

        const destaques = await resposta.json();

        containerDestaques.innerHTML = "";

        destaques.slice(0, 5).forEach(produto => {
            const card = document.createElement("article");

            card.className = "produto-mini";

            card.innerHTML = `
                <img src="${escaparHTML(produto.image)}"
                     alt="${escaparHTML(produto.title)}">

                <h3>${escaparHTML(produto.title)}</h3>

                <p>${escaparHTML(produto.description)}</p>

                <b>${formatarPreco(produto.price)}</b>

                <button class="btn-primary"
                        data-api-id="${produto.id}">
                    Adicionar ao carrinho
                </button>
            `;

            containerDestaques.appendChild(card);
        });

        containerDestaques.addEventListener("click", evento => {
            const botao = evento.target.closest("[data-api-id]");

            if (!botao) return;

            const produto = destaques.find(
                item => item.id === Number(botao.dataset.apiId)
            );

            if (produto) {
                adicionarProduto({
                    ...produto,
                    id: "api-" + produto.id
                });
            }
        });

    } catch (error) {
        console.error(error);
        containerDestaques.innerHTML =
            "Não foi possível carregar os produtos.";
    }
}

// ==========================================
// CARREGAR PRODUTOS DO JSON
// ==========================================

async function carregarProdutos() {
    if (!containerProdutos) return;

    try {
       const resposta = await fetch("https://fakestoreapi.com/products");
        if (!resposta.ok) {
            throw new Error("Erro ao carregar produtos");
        }

        produtos = await resposta.json();

        const params = new URLSearchParams(location.search);
        const pesquisa = params.get("pesquisa") || "";

        const campoBusca = document.querySelector(".busca input");
        if (campoBusca) campoBusca.value = pesquisa;

        if (pesquisa) {
            filtrarPorNome(pesquisa);
        } else {
            criarCardProduto(produtos);
        }
    } catch (error) {
        console.error(error);

        containerProdutos.innerHTML =
            "Não foi possível carregar os produtos.";
    }
}

// ==========================================
// CRIAR CARDS
// ==========================================

function criarCardProduto(listaProdutos) {
    if (!containerProdutos) return;

    containerProdutos.innerHTML = "";

    if (!listaProdutos.length) {
        containerProdutos.innerHTML = "Nenhum produto encontrado.";
        return;
    }

    listaProdutos.forEach(produto => {
        const card = document.createElement("article");

        card.className = "card-produto";

        card.innerHTML = `
            <img
                src="${escaparHTML(produto.image || "")}"
                alt="${escaparHTML(produto.title || "Produto")}"
                style="width:100%;height:150px;object-fit:contain"
            >

            <h3>${escaparHTML(produto.title)}</h3>

            <p>${formatarPreco(produto.price)}</p>

            <span>${escaparHTML(produto.category || "")}</span>

            <button class="btn-primary"
                    data-produto-id="${escaparHTML(produto.id)}">
                Adicionar ao carrinho
            </button>
        `;

        containerProdutos.appendChild(card);
    });
}

// ==========================================
// FILTROS
// ==========================================

function filtrarPorCategoria(categoriaEscolhida) {
    if (categoriaEscolhida === "todos") {
        criarCardProduto(produtos);
        return;
    }

    const filtrados = produtos.filter(produto =>
        produto.category === categoriaEscolhida
    );

    criarCardProduto(filtrados);
}

function filtrarPorNome(pesquisa) {
    const limpar = t => String(t || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const texto = limpar(pesquisa);

    const filtrados = produtos.filter(produto =>
        limpar(produto.title).includes(texto) ||
        limpar(produto.category).includes(texto)
    );

    criarCardProduto(filtrados);
}
// ==========================================
// EVENTOS
// ==========================================

document.addEventListener("click", evento => {
    const botaoProduto = evento.target.closest("[data-produto-id]");

    if (botaoProduto) {
        const produto = produtos.find(
            item => String(item.id) === botaoProduto.dataset.produtoId
        );

        if (produto) adicionarProduto(produto);
    }

    const botaoAcao = evento.target.closest("[data-acao]");

    if (botaoAcao) {
        const id = botaoAcao.dataset.id;
        const acao = botaoAcao.dataset.acao;

        if (acao === "aumentar") alterarQuantidade(id, 1);
        if (acao === "diminuir") alterarQuantidade(id, -1);
        if (acao === "remover") removerProduto(id);
    }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    carregarDestaquesAPI();
    carregarProdutos();
    atualizarContador();
    renderizarCarrinho();
    
});
// ==========================================
// VALIDAÇÃO DOS DADOS DO CLIENTE
// ==========================================

const formDados = document.querySelector("#form-dados");

if (formDados) {

    formDados.addEventListener("submit", function(event) {

        event.preventDefault();

        const cpf = document.querySelector("#cpf").value;
        const cep = document.querySelector("#cep").value;
        const telefone = document.querySelector("#telefone").value;
        const email = document.querySelector("#email").value;
        const numero = document.querySelector("#numero").value;

        const mensagem = document.querySelector("#mensagem-erro");

        mensagem.textContent = "";
        mensagem.style.color = "red";

        // Validar CPF
        if (!validarCPF(cpf)) {
            mensagem.textContent = "CPF inválido!";
            return;
        }

        // Validar CEP
        if (!/^[0-9]{5}-?[0-9]{3}$/.test(cep)) {
            mensagem.textContent = "CEP inválido!";
            return;
        }

        // Validar telefone
        const telefoneLimpo = telefone.replace(/\D/g, "");

        if (telefoneLimpo.length < 10 ||
            telefoneLimpo.length > 11) {
            mensagem.textContent = "Telefone inválido!";
            return;
        }

        // Validar e-mail
        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValido) {
            mensagem.textContent = "E-mail inválido!";
            return;
        }

        // Validar número da residência
        if (!numero.trim() || !/^\d+[a-zA-Z]?$/.test(numero.trim())) {
            mensagem.textContent = "Número da residência inválido!";
            return;
        }

        mensagem.style.color = "green";
        mensagem.textContent = "Dados validados com sucesso!";

        // Aqui você pode continuar para a próxima página
        // window.location.href = "Checkout.html";

    });

}

// ==========================================
// VALIDAR CPF
// ==========================================

function validarCPF(cpf) {

    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 ||
        /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    if (resto !== Number(cpf[9])) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;

    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
}

document.addEventListener("change", evento => {
    if (evento.target.name === "frete") renderizarCarrinho();
});
