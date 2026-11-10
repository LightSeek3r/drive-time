import { useState, type ComponentProps } from 'react';
import type { Lang, LatLng } from '../../domain/types';
import { usePlaceSearch } from '../../hooks/usePlaceSearch';
import { useT } from '../../i18n';
import { ERROR_COPY } from '../ErrorBanner/copy';
import { PlaceField } from '../PlaceField/PlaceField';

type PassThrough = Pick<
  ComponentProps<typeof PlaceField>,
  'label' | 'value' | 'tag' | 'onSelect' | 'onFocus' | 'trailing' | 'shape' | 'placeholder'
>;

interface PlaceSearchFieldProps extends PassThrough {
  apiKey: string;
  lang: Lang;
  near?: LatLng;
}

/** Wires a PlaceField to the place search hook; the field itself stays presentational. */
export function PlaceSearchField({
  apiKey,
  lang,
  near,
  onSelect,
  ...field
}: PlaceSearchFieldProps) {
  const t = useT();
  const [query, setQuery] = useState('');
  const { suggestions, status, error } = usePlaceSearch({ query, apiKey, lang, near });
  const errorMessage =
    error === null || error === 'aborted' ? undefined : t(ERROR_COPY[error].text);

  return (
    <PlaceField
      {...field}
      suggestions={suggestions}
      status={status}
      errorMessage={errorMessage}
      onQueryChange={setQuery}
      onSelect={onSelect}
    />
  );
}
