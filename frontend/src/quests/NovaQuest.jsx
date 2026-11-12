import React, { useEffect, useState } from 'react';
import { ApiError, createQuest, getToken, listQuestCategories } from './api.js';
import { CATEGORIAS_EXEMPLO, MODO_DEMONSTRACAO } from './config.js';

// Squad 2 — tela "Nova quest" (história #108), no visual do Figma "Questify — UX/UI".
// A validação aqui é só de conveniência: a regra vale no servidor.

const DIFICULDADES = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' };
const VAZIO = { categoryId: '', title: '', description: '', deadline: '' };
// Só para exibição: a regra que vale é a do servidor (src/business/domain/quests/xp-policy.js).
const GUILD_XP_MULTIPLIER = 3;

// Mesmo fuso usado pelo servidor ao validar o prazo (quest.service.js).
function hojeLocal() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function validar({ categoryId, title, deadline }) {
  const erros = {};
  if (!categoryId) erros.categoryId = 'Selecione uma categoria.';
  if (!title.trim()) erros.title = 'Informe o título da quest.';
  if (!deadline) erros.deadline = 'Informe o prazo da quest.';
  return erros;
}

function Icone({ d, tamanho = 20 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d.map((path) => <path key={path} d={path} />)}
    </svg>
  );
}

const ICONES = {
  busca: ['M21 21l-4.3-4.3', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'],
  sino: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.9 1.9 0 0 0 3.4 0'],
  calendario: ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 10h18'],
};

function Navbar() {
  return (
    <header className="q-topbar">
      <div className="q-brand-links">
        <a className="q-brand" href="quests.html">
          <svg className="q-brand-icon" viewBox="0 0 34 34" aria-hidden="true">
            <rect width="34" height="34" rx="8" fill="#1D5FC4" />
            <circle cx="15.5" cy="15.5" r="7.4" fill="none" stroke="#FFFFFF" strokeWidth="3.2" />
            <line x1="20.6" y1="20.6" x2="25.6" y2="25.6" stroke="#F2B33D" strokeWidth="3.4" strokeLinecap="round" />
          </svg>
          Questify
        </a>
      </div>
      <div className="q-nav-actions">
        <span className="q-nav-search" aria-hidden="true">
          <Icone d={ICONES.busca} tamanho={18} />
          Buscar quests e guildas
        </span>
        <span className="q-nav-icon" aria-hidden="true"><Icone d={ICONES.sino} /></span>
      </div>
    </header>
  );
}

function Campo({ id, rotulo, erro, children }) {
  return (
    <div className="q-field">
      <label htmlFor={id}>{rotulo}</label>
      {children}
      {erro && <span className="q-field-error" id={`${id}-erro`}>{erro}</span>}
    </div>
  );
}

export default function NovaQuest() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [semSessao, setSemSessao] = useState(!MODO_DEMONSTRACAO && !getToken());
  const [falhaCarga, setFalhaCarga] = useState('');
  const [dados, setDados] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [mensagem, setMensagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (semSessao) {
      setCarregando(false);
      return;
    }
    listQuestCategories()
      .then(setCategorias)
      .catch((erro) => {
        if (MODO_DEMONSTRACAO) setCategorias(CATEGORIAS_EXEMPLO);
        else if (erro instanceof ApiError && erro.status === 401) setSemSessao(true);
        else setFalhaCarga('Não foi possível carregar as categorias. Tente novamente.');
      })
      .finally(() => setCarregando(false));
  }, [semSessao]);

  const categoria = categorias.find((c) => String(c.id) === String(dados.categoryId)) || null;
  const bloqueado = !categoria; // história #108, tarefa 7: campos liberados após escolher a categoria

  function alterar(campo, valor) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
    setMensagem(null);
  }

  function limpar() {
    setDados(VAZIO);
    setErros({});
    setMensagem(null);
  }

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validar(dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    if (MODO_DEMONSTRACAO) {
      // Não chama a API: mostra o que o servidor gravaria (status pendente, XP da categoria).
      const titulo = dados.title.trim();
      setDados(VAZIO);
      setMensagem({
        tipo: 'sucesso',
        texto: `Modo demonstração: a quest "${titulo}" seria criada como pendente, com +${categoria.baseXp} XP. Nada foi salvo.`,
      });
      return;
    }

    setEnviando(true);
    try {
      const quest = await createQuest({
        categoryId: Number(dados.categoryId),
        title: dados.title,
        description: dados.description,
        deadline: dados.deadline,
      });
      setDados(VAZIO);
      setMensagem({ tipo: 'sucesso', texto: `Quest "${quest.title}" criada como pendente. Ao concluir: +${quest.xp} XP.` });
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) setSemSessao(true);
      else if (erro instanceof ApiError && erro.fields) setErros(erro.fields);
      else setMensagem({ tipo: 'erro', texto: erro.message || 'Não foi possível criar a quest.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="q-content">
        <div className="q-page-title">
          {MODO_DEMONSTRACAO && <span className="q-demo-badge">Modo demonstração · nada é salvo</span>}
          <h1>Nova quest</h1>
          <p>Crie uma quest a partir de uma categoria.</p>
        </div>

        {semSessao ? (
          <div className="q-card q-notice">
            <p>Faça login para criar suas quests.</p>
            <a className="q-btn q-btn-primary" href="index.html">Ir para o login</a>
          </div>
        ) : (
          <div className="q-columns">
            <form className="q-card q-form" onSubmit={enviar} noValidate>
              <h2>Dados da quest</h2>

              <Campo id="categoryId" rotulo="Categoria" erro={erros.categoryId}>
                <select
                  id="categoryId"
                  required
                  disabled={carregando}
                  value={dados.categoryId}
                  aria-invalid={Boolean(erros.categoryId)}
                  aria-describedby={erros.categoryId ? 'categoryId-erro' : undefined}
                  onChange={(e) => alterar('categoryId', e.target.value)}
                >
                  <option value="" disabled>{carregando ? 'Carregando categorias...' : 'Selecione uma categoria'}</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Campo>
              {falhaCarga && <div className="q-message q-message-erro" role="alert">{falhaCarga}</div>}

              <Campo id="title" rotulo="Título" erro={erros.title}>
                <input
                  id="title"
                  type="text"
                  maxLength={100}
                  placeholder="Ex.: Resumo do capítulo 6"
                  disabled={bloqueado}
                  value={dados.title}
                  aria-invalid={Boolean(erros.title)}
                  aria-describedby={erros.title ? 'title-erro' : undefined}
                  onChange={(e) => alterar('title', e.target.value)}
                />
              </Campo>

              <Campo id="description" rotulo="Descrição" erro={erros.description}>
                <textarea
                  id="description"
                  maxLength={1000}
                  placeholder="Descreva o que precisa ser feito"
                  disabled={bloqueado}
                  value={dados.description}
                  onChange={(e) => alterar('description', e.target.value)}
                />
              </Campo>

              <div className="q-field-pair">
                <Campo id="deadline" rotulo="Prazo" erro={erros.deadline}>
                  <span className="q-date">
                    <Icone d={ICONES.calendario} tamanho={18} />
                    <input
                      id="deadline"
                      type="date"
                      required
                      min={hojeLocal()}
                      disabled={bloqueado}
                      value={dados.deadline}
                      aria-invalid={Boolean(erros.deadline)}
                      aria-describedby={erros.deadline ? 'deadline-erro' : undefined}
                      onChange={(e) => alterar('deadline', e.target.value)}
                    />
                  </span>
                </Campo>
                <Campo id="difficulty" rotulo="Dificuldade">
                  <input
                    id="difficulty"
                    type="text"
                    readOnly
                    placeholder="Definida pela categoria"
                    value={categoria ? DIFICULDADES[categoria.difficulty] : ''}
                  />
                </Campo>
              </div>

              {mensagem && (
                <div className={`q-message q-message-${mensagem.tipo}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
                  {mensagem.texto}
                </div>
              )}

              <div className="q-actions">
                <button type="button" className="q-btn q-btn-outline" onClick={limpar}>Cancelar</button>
                <button type="submit" className="q-btn q-btn-primary" disabled={enviando || carregando}>
                  {enviando ? 'Criando...' : 'Criar quest'}
                </button>
              </div>
            </form>

            <aside className="q-card q-summary" aria-label="Resumo da categoria">
              <h2>Resumo da categoria</h2>
              <hr />
              <div className="q-summary-line"><span>Categoria</span><strong>{categoria ? categoria.name : '—'}</strong></div>
              <hr />
              <div className="q-summary-line">
                <span>Dificuldade</span>
                {categoria ? <span className="q-tag">{DIFICULDADES[categoria.difficulty]}</span> : <strong>—</strong>}
              </div>
              <hr />
              <div className="q-summary-line"><span>Recompensa</span><strong>{categoria ? `${categoria.baseXp} XP` : '—'}</strong></div>
              <hr />
              <div className="q-summary-line"><span>Status inicial</span><span className="q-tag">Pendente</span></div>
              <div className="q-summary-note">
                Quests individuais concedem o XP da categoria. Desafios de guilda concedem {GUILD_XP_MULTIPLIER}x esse XP.
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}
