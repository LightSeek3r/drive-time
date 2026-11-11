import { handleApiRequest, type Env } from './proxy';

export default {
  fetch: (request, env) => handleApiRequest(request, env),
} satisfies ExportedHandler<Env>;
