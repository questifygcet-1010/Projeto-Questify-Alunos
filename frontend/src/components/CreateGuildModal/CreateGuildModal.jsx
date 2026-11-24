'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button/Button';
import FieldError from '@/components/FieldError/FieldError';
import Modal from '@/components/Modal/Modal';
import { AwardIcon, SelectChevronIcon } from '@/components/icons';
import { isValidGuildName, normalizeGuildName } from '@/lib/guildName';
import { clearSession } from '@/services/auth';
import { createGuild, fetchCategories } from '@/services/guilds';
import styles from './CreateGuildModal.module.css';

const DESCRIPTION_MAX = 200;
const CREATED_GUILD_KEY = 'questify_created_guild';

const MESSAGES = {
  name: 'O nome da guilda deve ter entre 3 e 30 caracteres.',
  categoryId: 'Selecione uma categoria válida.',
  duplicate: 'Este nome de guilda já está em uso, escolha outro.',
  generic: 'Não foi possível criar a guilda.',
  categoriesFailed: 'Não foi possível carregar as categorias.',
};

/**
 * Modal "Criar guilda" (58:1150; estados 267:2, 271:20, 271:173; mobile 272:2).
 * Integra com a API real: GET /api/v1/guild-categories e POST /api/v1/guilds.
 */
export default function CreateGuildModal({ open, onClose }) {
  const router = useRouter();
  const nameRef = useRef(null);
  const categoryRef = useRef(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleUnauthorized() {
    clearSession();
    router.replace('/login');
  }

  // Carrega as categorias ao abrir (e limpa o formulário ao fechar).
  useEffect(() => {
    if (!open) {
      setName('');
      setCategoryId('');
      setDescription('');
      setErrors({});
      setFormError('');
      return undefined;
    }
    let active = true;
    setLoadingCategories(true);
    fetchCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          handleUnauthorized();
          return;
        }
        setErrors((current) => ({ ...current, categoryId: MESSAGES.categoriesFailed }));
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });
    return () => {
      active = false;
    };
    // Só recarrega ao abrir; handleUnauthorized depende apenas do router (estável).
  }, [open]);

  function focusFirstError(fieldErrors) {
    if (fieldErrors.name) nameRef.current?.focus();
    else if (fieldErrors.categoryId) categoryRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const fieldErrors = {};
    if (!isValidGuildName(name)) fieldErrors.name = MESSAGES.name;
    if (!categoryId) fieldErrors.categoryId = MESSAGES.categoryId;
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      focusFirstError(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      // A descrição fica só na interface: o backend ainda não aceita o campo.
      const guild = await createGuild({ name: normalizeGuildName(name), categoryId });
      const category = categories.find((option) => String(option.id) === String(categoryId));
      window.sessionStorage.setItem(
        CREATED_GUILD_KEY,
        JSON.stringify({ ...guild, categoryName: category?.name }),
      );
      router.push(`/guilds/${encodeURIComponent(guild.id)}`);
    } catch (error) {
      setSubmitting(false);
      if (error.status === 401) {
        handleUnauthorized();
        return;
      }
      if (error.status === 409) {
        const duplicate = { name: MESSAGES.duplicate };
        setErrors(duplicate);
        focusFirstError(duplicate);
        return;
      }
      if (error.status === 400 && error.fields) {
        const apiErrors = {};
        if (error.fields.name) apiErrors.name = error.fields.name;
        if (error.fields.categoryId) apiErrors.categoryId = error.fields.categoryId;
        if (Object.keys(apiErrors).length > 0) {
          setErrors(apiErrors);
          focusFirstError(apiErrors);
          return;
        }
      }
      setFormError(error.message || MESSAGES.generic);
    }
  }

  const describedBy = (field, extra) =>
    [errors[field] ? `criar-guilda-${field}-erro` : null, extra].filter(Boolean).join(' ') || undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Criar guilda"
      titleId="criar-guilda-titulo"
      initialFocusRef={nameRef}
      closable={!submitting}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="criar-guilda-nome" className={styles.label}>Nome da guilda</label>
          <input
            ref={nameRef}
            id="criar-guilda-nome"
            className={`${styles.control} ${errors.name ? styles.invalid : ''}`}
            type="text"
            value={name}
            maxLength={120}
            autoComplete="off"
            placeholder="Ex.: Cálculo I — Turma B"
            disabled={submitting}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          <FieldError id="criar-guilda-name-erro">{errors.name}</FieldError>
        </div>

        <div className={styles.field}>
          <label htmlFor="criar-guilda-categoria" className={styles.label}>Categoria</label>
          <div className={styles.selectWrapper}>
            <select
              ref={categoryRef}
              id="criar-guilda-categoria"
              className={`${styles.control} ${styles.select} ${categoryId ? '' : styles.placeholder} ${errors.categoryId ? styles.invalid : ''}`}
              value={categoryId}
              disabled={submitting || loadingCategories}
              aria-invalid={errors.categoryId ? true : undefined}
              aria-describedby={describedBy('categoryId')}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setErrors((current) => ({ ...current, categoryId: undefined }));
              }}
            >
              <option value="">{loadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <SelectChevronIcon className={styles.chevron} />
          </div>
          <FieldError id="criar-guilda-categoryId-erro">{errors.categoryId}</FieldError>
        </div>

        <div className={styles.field}>
          <label htmlFor="criar-guilda-descricao" className={styles.label}>Descrição (opcional)</label>
          {/* TODO(api): enviar a descrição quando POST /api/v1/guilds aceitar o campo. */}
          <textarea
            id="criar-guilda-descricao"
            className={`${styles.control} ${styles.textarea}`}
            value={description}
            maxLength={DESCRIPTION_MAX}
            placeholder="Conte o objetivo do grupo de estudo"
            disabled={submitting}
            aria-describedby="criar-guilda-descricao-contador"
            onChange={(event) => setDescription(event.target.value)}
          />
          <p id="criar-guilda-descricao-contador" className={styles.counter}>
            {description.length}/{DESCRIPTION_MAX}
            <span className="visually-hidden"> caracteres</span>
          </p>
        </div>

        <p className={styles.notice}>
          <AwardIcon className={styles.noticeIcon} />
          Você será o administrador desta guilda e o primeiro monitor.
        </p>

        {formError && <p className={styles.formError} role="alert">{formError}</p>}

        <div className={styles.actions}>
          <Button variant="secondary" size="lg" onClick={onClose} disabled={submitting} className={styles.action}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" loading={submitting} className={styles.action}>
            {submitting ? 'Criando...' : 'Criar guilda'}
          </Button>
        </div>
        <p className="visually-hidden" role="status">{submitting ? 'Criando a guilda...' : ''}</p>
      </form>
    </Modal>
  );
}
