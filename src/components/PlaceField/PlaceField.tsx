import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { Place } from '../../domain/types';
import { useT } from '../../i18n';
import { Icon, type IconName } from '../Icon/Icon';
import styles from './PlaceField.module.css';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

/** A fixed entry offered before the user types (a saved place, or the prompt to set one up). */
export interface PlaceShortcut {
  id: string;
  label: string;
  address?: string;
  icon: IconName;
  /** An unset place: drawn as an invitation, not a destination. */
  setup?: boolean;
  onChoose: () => void;
}

interface PlaceFieldProps {
  label: string;
  value: Place | null;
  /** A saved-place name ("Home") shown in bold ahead of the address. */
  tag?: string;
  suggestions: readonly Place[];
  /** Offered while the field is focused and empty of typing, so Home and Work are one pick away. */
  shortcuts?: readonly PlaceShortcut[];
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
  /** The glyph on the route rail; omit for a field outside the From/To stack. */
  marker?: 'from' | 'to';
  /** Overrides the default search hint while the field is empty (e.g. a labelled sample route). */
  placeholder?: string;
}

interface Option {
  id: string;
  label: string;
  address: string;
  icon: IconName | null;
  setup: boolean;
  choose: () => void;
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
  shortcuts = [],
  status,
  errorMessage,
  onQueryChange,
  onSelect,
  onFocus,
  trailing,
  shape = 'solo',
  marker,
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
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const typing = draft !== null && draft.trim() !== '';
  const showShortcuts = focused && !dismissed && !typing && shortcuts.length > 0;
  const showsMessage = status === 'loading' || status === 'error' || status === 'ready';
  const showResults = focused && searching && typing && (suggestions.length > 0 || showsMessage);
  const open = showShortcuts || showResults;
  const text = draft ?? plainText(value, tag);

  const reset = () => {
    // Blurring closes the keyboard on phones and keeps the shortcut list from reopening on the same focus.
    inputRef.current?.blur();
    setDraft(null);
    setSearching(false);
    setActiveIndex(-1);
    onQueryChange('');
  };

  const options: readonly Option[] = showShortcuts
    ? shortcuts.map((shortcut) => ({
        id: shortcut.id,
        label: shortcut.label,
        address: shortcut.address ?? '',
        icon: shortcut.icon,
        setup: shortcut.setup === true,
        choose: () => {
          reset();
          shortcut.onChoose();
        },
      }))
    : suggestions.map((place) => ({
        id: place.id,
        label: place.label,
        address: place.address,
        icon: null,
        setup: false,
        choose: () => {
          reset();
          onSelect(place);
        },
      }));
  const hasOptions = options.length > 0;

  const move = (step: 1 | -1) => {
    if (!hasOptions) return;
    setDismissed(false);
    setActiveIndex((current) => (current + step + options.length) % options.length);
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
        const chosen = options[activeIndex] ?? (showResults ? options[0] : undefined);
        if (open && chosen !== undefined) {
          event.preventDefault();
          chosen.choose();
        }
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setDismissed(true);
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
      {marker !== undefined && <span className={`${styles.marker} ${styles[marker]}`} />}
      <label htmlFor={inputId} className={marker === undefined ? styles.label : 'sr-only'}>
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
            setDismissed(false);
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
            setDismissed(false);
            setActiveIndex(-1);
            onQueryChange(event.target.value);
          }}
          onClick={() => setDismissed(false)}
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
          hidden={!hasOptions}
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={`${styles.option} ${option.setup ? styles.setup : ''}`}
              data-active={index === activeIndex}
              // Keeps focus in the input so the field's blur handler does not close the list first.
              onPointerDown={(event) => event.preventDefault()}
              onClick={option.choose}
            >
              {option.icon !== null && (
                <span className={styles.optionIcon}>
                  <Icon name={option.icon} size={16} />
                </span>
              )}
              <span className={styles.optionText}>
                <span className={styles.optionLabel}>{option.label}</span>
                {option.address !== '' && (
                  <span className={styles.optionAddress}>{option.address}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        {!hasOptions && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
