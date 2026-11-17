import { Categoria, TipoBeneficio } from './reward-types.js';

const CUSTO_XP_DOBRO = 150;
const CUSTO_PROTECAO_SEQUENCIA = 150;
const CUSTO_RECUPERAR_SEQUENCIA = 300;
const CUSTO_PRORROGACAO_PRAZO = 100;

/**
 * @typedef {Object} Reward
 * @property {string} codigo
 * @property {string} nome
 * @property {string} descricao
 * @property {number} custoGold
 * @property {string} categoria       
 * @property {string} tipoBeneficio   
 * @property {number|null|undefined} limiteSemanal  null = sem limite
 */

/** @type {Reward[]} */
export const REWARD_CATALOG = Object.freeze([
  {
    codigo: 'xp-dobro-24h',
    nome: 'XP em dobro (24 h)',
    descricao: 'Dobra o XP ganho ao concluir quests durante 24 horas.',
    custoGold: CUSTO_XP_DOBRO,
    categoria: Categoria.IMPULSOS,
    tipoBeneficio: TipoBeneficio.XP_DOBRO,
    limiteSemanal: 2,
  },
  {
    codigo: 'protecao-sequencia',
    nome: 'Proteção de sequência',
    descricao: 'Mantém sua sequência quando você fica um dia sem atividade.',
    custoGold: CUSTO_PROTECAO_SEQUENCIA,
    categoria: Categoria.PROTECAO_SEQUENCIA,
    tipoBeneficio: TipoBeneficio.PROTECAO_SEQUENCIA,
    limiteSemanal: 3,
  },
  {
    codigo: 'recuperar-sequencia',
    nome: 'Recuperar sequência',
    descricao: 'Restaura uma sequência que foi perdida.',
    custoGold: CUSTO_RECUPERAR_SEQUENCIA,
    categoria: Categoria.PROTECAO_SEQUENCIA,
    tipoBeneficio: TipoBeneficio.RECUPERAR_SEQUENCIA,
    limiteSemanal: 2,
  },
  {
    codigo: 'prorrogacao-prazo-24h',
    nome: 'Prorrogação de prazo (24 h)',
    descricao: 'Adiciona 24 horas ao prazo de uma quest aberta.',
    custoGold: CUSTO_PRORROGACAO_PRAZO,
    categoria: Categoria.PRAZOS,
    tipoBeneficio: TipoBeneficio.PRORROGACAO_PRAZO,
    limiteSemanal: 2,
  },
]);
