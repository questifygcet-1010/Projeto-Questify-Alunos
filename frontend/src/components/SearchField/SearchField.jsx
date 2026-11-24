import { forwardRef } from 'react';
import { SearchIcon } from '@/components/icons';
import styles from './SearchField.module.css';

/** Campo de busca (58:637): branco, borda line, lupa à esquerda. */
const SearchField = forwardRef(function SearchField({ id, label, value, onChange, placeholder, ...rest }, ref) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className="visually-hidden">{label}</label>
      <SearchIcon className={styles.icon} />
      <input
        ref={ref}
        id={id}
        className={styles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
    </div>
  );
});

export default SearchField;
