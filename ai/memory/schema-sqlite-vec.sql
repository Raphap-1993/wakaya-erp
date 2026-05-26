-- Optional sqlite-vec schema (accelerator).
--
-- La memoria del agente NO requiere sqlite-vec: la busqueda semantica por
-- defecto funciona con la tabla regular `ai_chunk_embeddings` (vector como
-- JSON) y cosine en JavaScript. Eso evita acoplar el template a una
-- extension nativa.
--
-- Este schema agrega una tabla virtual vec0 como ACELERADOR opcional para
-- corpus grandes donde el cosine en JS se quede corto. Solo aplica cuando
-- los embeddings provienen de un proveedor de dimension fija conocida.
--
-- Para activarlo:
--   1) Compila o descarga sqlite-vec (vec0.dll/so/dylib).
--   2) Ajusta 1536 abajo a la dimension de tu proveedor.
--   3) Carga la extension con --sqlite-vec-extension <ruta> antes de:
--        node scripts/ai-framework-agent.mjs import-embeddings ...
--        node scripts/ai-framework-agent.mjs search --semantic --embedding <vector> --sqlite-vec-extension <ruta>
--
-- Sin la extension, usa: node scripts/ai-framework-agent.mjs embed-docs
-- y luego search --query "..." --semantic (embedder local, cosine en JS).

CREATE VIRTUAL TABLE IF NOT EXISTS vec_document_chunks USING vec0(
  embedding float[1536]
);
