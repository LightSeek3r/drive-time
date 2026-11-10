import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Place } from '../../domain/types';
import { useT } from '../../i18n';
import styles from './PlaceField.module.css';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

interface PlaceFieldProps {
  label: string;
  value: Place | null;
  /** A saved-place name ("Home") shown in bold ahead of the address. */
  tag?: string;
  suggestions: readonly Place[];
  status: SearchStatus;
  /** Shown in place of the list when the search failed. */
  errorMessage?: string;
  onQueryChange: (query: string) => void;
  onSelect: (place: Place) => void;
  onFocus?: () => void;
  /** Controls that live inside the field, after the text (e.g. "use my location"). */
  trailing?: ReactNode;
  /** Where the field sits in the From/To stack, so the pair shares one hairline. */
  shape?: 'solo' | 'top' | 'bottom';
  /** Overrides the default search hint while the field is empty (e.g. a labelled sample route). */
  placeholder?: string;
}

function addressOf(place: Place): string {
  return place.address === '' ? place.label : place.address;
}

function plainText(place: Place | null, tag: string | undefined): string {
  if (place === null) return '';
  const detail = place.address === '' ? '' : addressOf(place);
  if (tag === undefined) return place.address === '' ? place.label : `${place.label}, ${detail}`;
  return detail === '' ? tag : `${tag} — ${detail}`;
}

/** Search combobox: ARIA 1.2 pattern with a listbox popup and a roving active descendant. */
export function PlaceField({
  label,
  value,
  tag,
  suggestions,
  status,
  errorMessage,
  onQueryChange,
  onSelect,
  onFocus,
  trailing,
  shape = 'solo',
  placeholder,
}: PlaceFieldProps) {
  const t = useT();
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const inputRef = useRef<HTMLInputElement>(null);

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hasSuggestions = suggestions.length > 0;
  const showsMessage = status === 'loading' || status === 'error' || status === 'ready';
  const open = focused && searching && (hasSuggestions || showsMessage);
  const text = draft ?? plainText(value, tag);

  const choose = (place: Place) => {
    onSelect(place);
    setDraft(null);
    setSearching(false);
    setActiveIndex(-1);
    onQueryChange('');
  };

  const move = (step: 1 | -1) => {
    if (!hasSuggestions) return;
    setSearching(true);
    setActiveIndex((current) => (current + step + suggestions.length) % suggestions.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Enter': {
        const chosen = suggestions[activeIndex] ?? (open ? suggestions[0] : undefined);
        if (chosen !== undefined) {
          event.preventDefault();
          choose(chosen);
        }
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setSearching(false);
          setActiveIndex(-1);
        } else if (draft !== null) {
          setDraft(null);
        }
        break;
    }
  };

  const message =
    status === 'loading'
      ? t('loading')
      : status === 'error'
        ? (errorMessage ?? t('error_unknown'))
        : t('no_suggestions');

  return (
    <div className={`${styles.field} ${styles[shape]}`}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <input
          ref={inputRef}
          id={inputId}
          className={`${styles.input} ${!focused && value !== null ? styles.covered : ''}`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder ?? t('placeholder_place')}
          value={text}
          onFocus={(event) => {
            setFocused(true);
            event.target.select();
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            setSearching(false);
            setDraft(null);
            setActiveIndex(-1);
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            setSearching(true);
            setActiveIndex(-1);
            onQueryChange(event.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
        {!focused && value !== null && (
          <span className={styles.display} aria-hidden="true">
            {tag !== undefined && <b className={styles.tag}>{tag}</b>}
            {tag !== undefined && ' — '}
            {tag !== undefined ? addressOf(value) : plainText(value, undefined)}
          </span>
        )}
      </div>
      {trailing}
      <div className={styles.popover} hidden={!open}>
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className={styles.list}
          hidden={!hasSuggestions}
        >
          {suggestions.map((place, index) => (
            <li
              key={place.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={styles.option}
              data-active={index === activeIndex}
              // Keeps focus in the input so the field's blur handler does not close the list first.
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(place)}
            >
              <span className={styles.optionLabel}>{place.label}</span>
              {place.address !== '' && (
                <span className={styles.optionAddress}>{place.address}</span>
              )}
            </li>
          ))}
        </ul>
        {!hasSuggestions && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
